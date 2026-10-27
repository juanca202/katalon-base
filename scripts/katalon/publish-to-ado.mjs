#!/usr/bin/env node
// Publica el resultado de una ejecución de Katalon Studio en Azure DevOps
// (ADR-006): crea un test run en el Test Plan, registra el resultado de cada
// caso en el test point de su Test Case (TC-<id> del nombre del caso) y adjunta
// las evidencias (ADR-003). Usa la API REST de Azure DevOps; no requiere la
// integración Enterprise de Katalon.
//
// Configuración:
//   - Organización y proyecto: projectManagement de .sdd-devkit/settings.json.
//   - ADO_PAT: Personal Access Token con permiso Test Management (Read & write).
//   - ADO_TEST_PLAN_ID: ID del Test Plan (o --plan <id>).
//   Las variables se leen del entorno o, si existe, del archivo .env (no versionado).
//
// Uso: node scripts/katalon/publish-to-ado.mjs [JUnit_Report.xml] [--plan <id>] [--dry-run]
//   Sin ruta toma el JUnit_Report.xml más reciente de tests/katalon/Reports.
//   --dry-run muestra qué se publicaría sin llamar a Azure DevOps.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import {
  REPORTS_DIR,
  mediaForCase,
  parseJUnit,
  reportEvidence,
  resolveJUnit,
} from './lib/report.mjs';

const API = 'api-version=7.1';
const API_PREVIEW = 'api-version=7.1-preview.1';
// Límite prudente por adjunto; los videos más grandes se informan y se omiten.
const MAX_ATTACHMENT_BYTES = 90 * 1024 * 1024;
const OUTCOME = {
  passed: 'Passed',
  failed: 'Failed',
  broken: 'Failed',
  skipped: 'NotExecuted',
};

function loadDotEnv(path = '.env') {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

function parseArgs(argv) {
  const args = { junit: null, plan: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--plan') args.plan = argv[++i];
    else args.junit = argv[i];
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

loadDotEnv();
const args = parseArgs(process.argv.slice(2));

const settings = JSON.parse(readFileSync('.sdd-devkit/settings.json', 'utf8'));
const pm = settings.projectManagement ?? {};
if (!pm.enabled || pm.provider !== 'azure-devops') {
  fail(
    'projectManagement de .sdd-devkit/settings.json no apunta a Azure DevOps.'
  );
}
const baseUrl = `${pm.host.replace(/\/+$/, '')}/${encodeURIComponent(pm.workspace)}/${encodeURIComponent(pm.project)}/_apis`;
const planId = Number(args.plan ?? process.env.ADO_TEST_PLAN_ID);

const junitPath = resolveJUnit(args.junit);
if (!junitPath || !existsSync(junitPath)) {
  fail(
    `No se encontró JUnit_Report.xml en ${REPORTS_DIR}. Ejecuta primero una Test Suite en Katalon Studio.`
  );
}
const reportDir = dirname(junitPath);
const cases = parseJUnit(readFileSync(junitPath, 'utf8'));
const { logs, media } = reportEvidence(reportDir);
const traced = cases.filter(tc => tc.tcId);
const untraced = cases.filter(tc => !tc.tcId);
const runName = `${cases[0]?.suite || 'Katalon'} - ${basename(reportDir)}`;

console.log(`Reporte: ${junitPath}`);
console.log(
  `Casos: ${cases.length} (${traced.length} con TC-<id>, ${untraced.length} sin)`
);
for (const tc of untraced)
  console.log(`  Sin TC-<id>, no se publica: ${tc.name}`);

if (args.dryRun) {
  console.log(
    `\n[dry-run] Test run «${runName}» en ${baseUrl}, plan ${planId || '(sin definir)'}`
  );
  for (const tc of traced) {
    const files = mediaForCase(media, reportDir, tc).map(file =>
      basename(file)
    );
    console.log(
      `  TC-${tc.tcId} → ${OUTCOME[tc.status]}${files.length ? ` · adjuntos: ${files.join(', ')}` : ''}`
    );
  }
  console.log(
    `  Adjuntos del run: JUnit_Report.xml${logs.length ? `, ${logs.map(f => basename(f)).join(', ')}` : ''}`
  );
  process.exit(0);
}

if (!planId)
  fail('Falta el Test Plan: define ADO_TEST_PLAN_ID o usa --plan <id>.');
if (!process.env.ADO_PAT)
  fail('Falta ADO_PAT (Personal Access Token de Azure DevOps).');
const auth = `Basic ${Buffer.from(`:${process.env.ADO_PAT}`).toString('base64')}`;

async function ado(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `${method} ${path} → ${response.status} ${await response.text()}`
    );
  }
  return response.status === 204 ? null : response.json();
}

async function attach(path, file, comment) {
  const size = statSync(file).size;
  if (size > MAX_ATTACHMENT_BYTES) {
    console.log(
      `  Omitido por tamaño (${Math.round(size / 1048576)} MB): ${file}`
    );
    return;
  }
  await ado('POST', `${path}?${API_PREVIEW}`, {
    stream: readFileSync(file).toString('base64'),
    fileName: basename(file),
    comment,
    attachmentType: 'GeneralAttachment',
  });
}

// Test points del plan para los Test Cases ejecutados.
const testCaseIds = [...new Set(traced.map(tc => Number(tc.tcId)))];
const points = (
  await ado('POST', `/test/points?${API}`, {
    PointsFilter: { TestcaseIds: testCaseIds },
  })
).points.filter(point => Number(point.testPlan?.id) === planId);
const pointsByCase = new Map();
for (const point of points) {
  const id = Number(point.testCase.id);
  pointsByCase.set(id, [...(pointsByCase.get(id) ?? []), Number(point.id)]);
}
const missing = testCaseIds.filter(id => !pointsByCase.has(id));
for (const id of missing) {
  console.log(
    `  TC-${id} no tiene test point en el plan ${planId}; no se publica.`
  );
}
if (pointsByCase.size === 0) fail('Ningún caso tiene test point en el plan.');

const run = await ado('POST', `/test/runs?${API}`, {
  name: runName,
  plan: { id: String(planId) },
  pointIds: [...pointsByCase.values()].flat(),
  isAutomated: false,
  startedDate: new Date(Math.min(...traced.map(tc => tc.start))).toISOString(),
});
console.log(`Test run ${run.id} creado: ${run.webAccessUrl ?? run.url}`);

const results = (await ado('GET', `/test/Runs/${run.id}/results?${API}`)).value;
const caseById = new Map(traced.map(tc => [Number(tc.tcId), tc]));
await ado(
  'PATCH',
  `/test/Runs/${run.id}/results?${API}`,
  results.map(result => {
    const tc = caseById.get(Number(result.testCase.id));
    return {
      id: result.id,
      state: 'Completed',
      outcome: OUTCOME[tc.status],
      durationInMs: tc.durationMs,
      errorMessage: tc.message || undefined,
      stackTrace: tc.trace || undefined,
      comment: `Katalon: ${tc.name}`,
    };
  })
);

for (const result of results) {
  const tc = caseById.get(Number(result.testCase.id));
  for (const file of mediaForCase(media, reportDir, tc)) {
    await attach(
      `/test/Runs/${run.id}/Results/${result.id}/attachments`,
      file,
      tc.name
    );
  }
}
for (const file of [junitPath, ...logs]) {
  await attach(`/test/Runs/${run.id}/attachments`, file, 'Reporte de Katalon');
}

await ado('PATCH', `/test/runs/${run.id}?${API}`, { state: 'Completed' });
console.log(
  `Publicados ${results.length} resultados en el test run ${run.id}.`
);
