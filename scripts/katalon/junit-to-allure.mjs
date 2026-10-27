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
import { spawnSync } from 'node:child_process';
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
const { logs, media, attachments } = reportEvidence(reportDir);
const sharedLogs = logs.map(file => {
  const source = `${randomUUID()}-attachment.log`;
  copyFileSync(file, join(outDir, source));
  return { name: basename(file), source, type: 'text/plain' };
});
const usedMedia = new Set();

// Katalon graba en AVI o MOV, que los navegadores no reproducen dentro del
// reporte. Si hay ffmpeg, el video se adjunta convertido a MP4 (H.264); si no,
// se adjunta el original y se avisa una sola vez.
const BROWSER_UNPLAYABLE = new Set(['.avi', '.mov']);
let ffmpegMissing = false;

function attachAsMp4(file) {
  if (ffmpegMissing) return null;
  const source = `${randomUUID()}-attachment.mp4`;
  const run = spawnSync(
    'ffmpeg',
    [
      '-loglevel',
      'error',
      '-y',
      '-i',
      file,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-movflags',
      '+faststart',
      '-an',
      join(outDir, source),
    ],
    { encoding: 'utf8' }
  );
  if (run.error?.code === 'ENOENT') {
    ffmpegMissing = true;
    console.warn(
      'ffmpeg no está instalado: los videos se adjuntan en su formato original (no se reproducen en el navegador).'
    );
    return null;
  }
  if (run.status !== 0) {
    console.warn(
      `No se pudo convertir a MP4 ${file}; se adjunta el original.\n${run.stderr}`
    );
    return null;
  }
  const name = `${basename(file, extname(file))}.mp4`;
  return { name, source, type: MIME['.mp4'] };
}

function attachMedia(tc) {
  return mediaForCase(media, reportDir, tc, attachments).map(file => {
    usedMedia.add(file);
    const ext = extname(file).toLowerCase();
    const mp4 = BROWSER_UNPLAYABLE.has(ext) ? attachAsMp4(file) : null;
    if (mp4) return mp4;
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
