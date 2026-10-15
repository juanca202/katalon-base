#!/usr/bin/env node
// Convierte el resultado de Maestro en resultados de Allure, de modo que las
// evidencias de todas las plataformas queden en un solo lugar (allure-results/).
// Maestro escribe <failure> sin `message`, lo que Allure lee como "passed", y
// no pasa por acceptanceCriterion(). Aquí se generan los *-result.json con el
// estado real, las mismas etiquetas del árbol de ADR-009
// (E2E > Mobile > US-XXX > AC-XXX) y las evidencias del flujo como adjuntos:
// screenshots (takeScreenshot), grabaciones (startRecording), commands.json y
// el log. Los títulos de la historia y del criterio salen de las specs de
// Playwright (tests/playwright), para que ambos motores compartan el mismo nodo.
//
// Uso: node scripts/maestro/junit-to-allure.mjs <junit.xml> <debug-output> [allure-results] [Android|iOS]
//   <debug-output>: carpeta de `maestro test --debug-output <dir> --flatten-debug-output`
import { createHash, randomUUID } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { extname, join } from 'node:path';

const [junitPath, debugDir, outDir = 'allure-results', os = 'Android'] =
  process.argv.slice(2);
if (!junitPath || !debugDir) {
  console.error(
    'Uso: junit-to-allure.mjs <junit.xml> <debug-output> [allure-results] [Android|iOS]'
  );
  process.exit(2);
}

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.json': 'application/json',
  '.log': 'text/plain',
};

// Copia cada archivo de evidencia del flujo a allure-results/ y devuelve los
// adjuntos en el formato de Allure.
const attachEvidence = flowName => {
  const flowDir = join(debugDir, flowName);
  if (!existsSync(flowDir)) return [];
  const attachments = [];
  const visit = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(path, entry.name);
        continue;
      }
      if (entry.name === 'manifest.json') continue;
      const ext = extname(entry.name).toLowerCase();
      const source = `${randomUUID()}-attachment${ext}`;
      copyFileSync(path, join(outDir, source));
      attachments.push({
        name: prefix ? `${prefix}/${entry.name}` : entry.name,
        source,
        type: MIME[ext] ?? 'application/octet-stream',
      });
    }
  };
  visit(flowDir, '');
  return attachments;
};

const decode = (v = '') =>
  v
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
const attr = (tag, name) =>
  decode((tag.match(new RegExp(`\\s${name}="([^"]*)"`)) ?? [])[1]);

if (!existsSync(junitPath)) {
  // Maestro no llegó a generar el reporte (sin flujos o sin dispositivo): no
  // se oculta con un stack trace; el error real ya salió de `maestro test`.
  console.error(
    `Maestro -> Allure: no existe ${junitPath}, no hay resultados que convertir`
  );
  process.exit(0);
}

// `US-001` -> 'US-001: Acceso demo…', `AC-003` -> 'AC-003: Sin creación…'
const titles = new Map();
const collectTitles = dir => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collectTitles(path);
    else if (entry.name.endsWith('.ts')) {
      const text = readFileSync(path, 'utf8');
      for (const [, full, id] of text.matchAll(
        /'(((?:US|AC)-\d+): [^'\n]+)'/g
      )) {
        if (!titles.has(id)) titles.set(id, full);
      }
    }
  }
};
collectTitles('tests/playwright');

const xml = readFileSync(junitPath, 'utf8');
mkdirSync(outDir, { recursive: true });

const cases = xml.matchAll(
  /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g
);
let count = 0;
for (const [, head, body = ''] of cases) {
  const name = attr(head, 'name');
  const file = attr(head, 'file') ?? '';
  const seconds = Number(attr(head, 'time') ?? 0);
  const stop = Date.parse(attr(head, 'timestamp') ?? '') || Date.now();
  const start = stop - Math.round(seconds * 1000);

  const failure = body.match(/<(failure|error)\b[^>]*>([\s\S]*?)<\/\1>/);
  const skipped = /<skipped\b/.test(body);
  const status = failure ? 'failed' : skipped ? 'skipped' : 'passed';
  const trace = failure ? decode(failure[2]).trim() : undefined;

  const tags = decode(
    (body.match(/<property name="tags" value="([^"]*)"/) ?? [])[1] ?? ''
  )
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  const story = tags.find(t => /^US-\d+/.test(t));
  const criterion = tags.find(t => /^AC-\d+/.test(t));
  const label = (n, v) => (v ? [{ name: n, value: v }] : []);

  const result = {
    uuid: randomUUID(),
    historyId: createHash('md5')
      .update(`maestro:${file || name}`)
      .digest('hex'),
    name,
    fullName: `maestro:${file || name}`,
    status,
    stage: 'finished',
    start,
    stop,
    ...(trace && {
      statusDetails: { message: trace.split('\n')[0], trace },
    }),
    labels: [
      ...label('framework', 'maestro'),
      ...label('language', 'yaml'),
      ...label('parentSuite', 'E2E'),
      ...label('platform', 'Mobile'),
      ...label('feature', story && (titles.get(story) ?? story)),
      ...label('story', criterion && (titles.get(criterion) ?? criterion)),
      ...tags.map(t => ({ name: 'tag', value: t })),
    ],
    attachments: attachEvidence(name),
    parameters: [{ name: 'Platform', value: os }],
  };
  writeFileSync(
    join(outDir, `${result.uuid}-result.json`),
    JSON.stringify(result)
  );
  count += 1;
}
console.log(`Maestro -> Allure: ${count} resultado(s) en ${outDir}`);
