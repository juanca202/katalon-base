#!/usr/bin/env node
// Convierte el resultado de una ejecución de Katalon Studio en resultados de
// Allure (ADR-004). Katalon escribe JUnit_Report.xml en
// tests/katalon/Reports/<fecha>/<suite>/<fecha>/, junto al log, las capturas y
// los videos de la ejecución. Aquí se genera un *-result.json por caso con su
// estado real, las etiquetas del árbol (Tipo > Plataforma > Historia > Criterio)
// y las evidencias como adjuntos.
//
// La historia y el criterio no salen de carpetas de Katalon: se leen de la
// especificación del caso en docs/specs (TC-<id>-*.md), que declara su
// criterio de aceptación y su historia padre.
//
// Uso: node scripts/katalon/junit-to-allure.mjs [JUnit_Report.xml] [allure-results] [plataforma]
//   Sin argumentos toma el JUnit_Report.xml más reciente de tests/katalon/Reports.
import { createHash, randomUUID } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import {
  MIME,
  REPORTS_DIR,
  mediaForCase,
  parseJUnit,
  reportEvidence,
  resolveJUnit,
  walk,
} from './lib/report.mjs';

const SPECS_DIR = 'docs/specs';

const [junitArg, outDir = 'allure-results', platform = 'Web desktop'] =
  process.argv.slice(2);

const junitPath = resolveJUnit(junitArg);
if (!junitPath || !existsSync(junitPath)) {
  console.error(
    `No se encontró JUnit_Report.xml en ${REPORTS_DIR}. Ejecuta primero una Test Suite en Katalon Studio.`
  );
  process.exit(2);
}
const reportDir = dirname(junitPath);

// Busca la especificación del caso (TC-<id>-*.md) y la de su historia padre.
const specFiles = existsSync(SPECS_DIR)
  ? walk(SPECS_DIR).filter(file => file.endsWith('.md'))
  : [];

function specFor(tcId) {
  const file = specFiles.find(path => basename(path).startsWith(`TC-${tcId}-`));
  if (!file) return {};
  const text = readFileSync(file, 'utf8');
  const meta = text.match(/<!--\s*tc:([^>]*)-->/)?.[1] ?? '';
  const testType = meta.match(/testType=([^·\s]+)/)?.[1];
  const criterion = text.match(
    /\*\*Criterio de aceptación:\*\*\s*(AC-\d+)[^—\n]*(?:—\s*([^\n]+))?/
  );
  const workItem = text.match(
    /\*\*Work Item \(ADO\):\*\*\s*\[[^\]]*\]\(([^)]+)\)/
  );
  const parent = meta.match(/parent=(US-\d+)/)?.[1];
  let story;
  if (parent) {
    const usReadme = specFiles.find(
      path =>
        basename(path) === 'README.md' &&
        basename(dirname(path)).startsWith(`${parent}-`)
    );
    const title = usReadme
      ? readFileSync(usReadme, 'utf8').match(/^#\s+(.+)$/m)?.[1]
      : null;
    story = title ?? parent;
  }
  return {
    testType,
    story,
    criterion: criterion
      ? criterion[2]
        ? `${criterion[1]}: ${criterion[2].trim()}`
        : criterion[1]
      : undefined,
    workItemUrl: workItem?.[1],
  };
}

// Evidencias del reporte: el log de la ejecución va a todos los casos; las
// capturas y videos, al caso cuyo TC-<id> o nombre aparece en su ruta.
mkdirSync(outDir, { recursive: true });
const { logs, media } = reportEvidence(reportDir);
const sharedLogs = logs.map(file => {
  const source = `${randomUUID()}-attachment.log`;
  copyFileSync(file, join(outDir, source));
  return { name: basename(file), source, type: 'text/plain' };
});
const usedMedia = new Set();

function attachMedia(tc) {
  return mediaForCase(media, reportDir, tc).map(file => {
    usedMedia.add(file);
    const ext = extname(file).toLowerCase();
    const source = `${randomUUID()}-attachment${ext}`;
    copyFileSync(file, join(outDir, source));
    return { name: basename(file), source, type: MIME[ext] };
  });
}

const cases = parseJUnit(readFileSync(junitPath, 'utf8'));
for (const tc of cases) {
  const spec = tc.tcId ? specFor(tc.tcId) : {};
  const labels = [
    { name: 'parentSuite', value: spec.testType ?? 'E2E' },
    { name: 'framework', value: 'katalon' },
    { name: 'suite', value: tc.suite },
  ];
  if ((spec.testType ?? 'E2E') !== 'API')
    labels.push({ name: 'platform', value: platform });
  if (spec.story) labels.push({ name: 'feature', value: spec.story });
  if (spec.criterion) labels.push({ name: 'story', value: spec.criterion });
  const result = {
    uuid: randomUUID(),
    historyId: createHash('md5').update(tc.name).digest('hex'),
    name: tc.shortName,
    fullName: tc.name,
    status: tc.status,
    statusDetails: { message: tc.message, trace: tc.trace },
    stage: 'finished',
    start: tc.start,
    stop: tc.stop,
    labels,
    links: spec.workItemUrl
      ? [{ name: `TC-${tc.tcId}`, url: spec.workItemUrl, type: 'tms' }]
      : [],
    attachments: [...attachMedia(tc), ...sharedLogs],
  };
  writeFileSync(
    join(outDir, `${result.uuid}-result.json`),
    JSON.stringify(result, null, 2)
  );
}

const unmatched = media.filter(file => !usedMedia.has(file));
console.log(
  `Katalon → Allure: ${cases.length} casos desde ${junitPath} → ${outDir}/`
);
if (unmatched.length > 0) {
  console.log(
    `Evidencias sin caso asociado (no se adjuntaron):\n${unmatched
      .map(file => `  ${file}`)
      .join('\n')}`
  );
}
