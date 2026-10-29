#!/usr/bin/env node
// Convierte el resultado de una ejecución de Katalon Studio en resultados de
// Allure (ADR-004). Katalon escribe JUnit_Report.xml en
// tests/katalon/Reports/<fecha>/<suite>/<fecha>/, junto al log, las capturas y
// los videos de la ejecución. Aquí se genera un *-result.json por caso con su
// estado real, las etiquetas del árbol (Tipo > Plataforma > Historia > Criterio),
// los pasos leídos del log, un mensaje de error entendible y las evidencias
// como adjuntos. Una colección de suites se convierte entera: cada suite con
// sus propias evidencias.
//
// La historia y el criterio no salen de carpetas de Katalon: se leen de la
// especificación del caso en docs/specs (TC-<id>-*.md), cuyo frontmatter declara su
// criterio de aceptación y su historia padre.
//
// Los resultados se acumulan: una corrida parcial solo reemplaza los casos que
// ejecutó y conserva el resto. Para empezar de cero, `npm run allure:katalon:reset`.
//
// Uso: node scripts/katalon/junit-to-allure.mjs [JUnit_Report.xml|carpeta] [allure-results] [plataforma]
//   Sin argumentos convierte todas las suites de la ejecución más reciente de
//   tests/katalon/Reports. Sin plataforma, se deduce del nombre de cada suite.
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import {
  MIME,
  REPORTS_DIR,
  mediaForCase,
  parseJUnit,
  reportEvidence,
  describeFailure,
  resolveSuiteReports,
  stepsByCase,
  walk,
} from './lib/report.mjs';

const SPECS_DIR = 'docs/specs';

const [junitArg, outDir = 'allure-results', platformArg] =
  process.argv.slice(2);

const suiteReports = resolveSuiteReports(junitArg);
if (suiteReports.length === 0) {
  console.error(
    `No se encontró JUnit_Report.xml en ${REPORTS_DIR}. Ejecuta primero una Test Suite en Katalon Studio.`
  );
  process.exit(2);
}

// Plataforma de la suite para el árbol de Allure: la indicada como argumento
// o la que dice el nombre de la suite (API, web móvil o web de escritorio).
function platformOf(junitPath) {
  if (platformArg) return platformArg;
  const suite = basename(dirname(dirname(junitPath)));
  if (/\bapi\b/i.test(suite)) return 'API';
  if (/m[oó]vil|mobile/i.test(suite)) return 'Web móvil';
  return 'Web desktop';
}

// Busca la especificación del caso (TC-<id>-*.md) y la de su historia padre.
const specFiles = existsSync(SPECS_DIR)
  ? walk(SPECS_DIR).filter(file => file.endsWith('.md'))
  : [];

// Lee el frontmatter YAML de la especificación: claves de primer nivel con
// valor escalar o lista en línea, y las claves de un objeto anidado como
// `objeto.clave` (p. ej. work_item.url).
function frontmatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  if (!block) return {};
  const unquote = value => value.trim().replace(/^(["'])(.*)\1$/, '$2');
  const data = {};
  let parentKey;
  for (const line of block.split('\n')) {
    const entry = line.match(/^(\s*)([a-z_]+):\s*(.*?)(?:\s+#.*)?$/);
    if (!entry) continue;
    const [, indent, key, value] = entry;
    if (!indent) parentKey = value ? undefined : key;
    const name = indent && parentKey ? `${parentKey}.${key}` : key;
    const list = value.match(/^\[(.*)\]$/);
    data[name] = list ? list[1].split(',').map(unquote) : unquote(value);
  }
  return data;
}

function specFor(tcId) {
  const file = specFiles.find(path => basename(path).startsWith(`TC-${tcId}-`));
  if (!file) return {};
  const meta = frontmatter(readFileSync(file, 'utf8'));
  // La primera palabra del primer tipo de prueba (API, E2E, Visual) es la
  // raíz del árbol de Allure.
  const testType = [meta.test_type].flat()[0]?.split(' ')[0] || undefined;
  const parent = meta.parent?.match(/^US-\d+$/)?.[0];
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
    criterion: meta.criterion_title
      ? `${meta.criterion}: ${meta.criterion_title}`
      : meta.criterion,
    workItemUrl: meta['work_item.url'],
  };
}

// Evidencias del reporte: el log de la ejecución va a todos los casos; las
// capturas y videos, al caso cuyo TC-<id> o nombre aparece en su ruta.
mkdirSync(outDir, { recursive: true });

// Elimina los resultados previos del mismo caso (y sus adjuntos) para que la
// nueva ejecución lo reemplace sin tocar los demás casos.
function removePrevious(historyId) {
  const results = readdirSync(outDir)
    .filter(file => file.endsWith('-result.json'))
    .map(file => ({
      path: join(outDir, file),
      data: JSON.parse(readFileSync(join(outDir, file), 'utf8')),
    }));
  const replaced = results.filter(r => r.data.historyId === historyId);
  const kept = new Set(
    results
      .filter(r => r.data.historyId !== historyId)
      .flatMap(r => (r.data.attachments ?? []).map(a => a.source))
  );
  for (const { path, data } of replaced) {
    for (const { source } of data.attachments ?? [])
      if (!kept.has(source)) rmSync(join(outDir, source), { force: true });
    rmSync(path, { force: true });
  }
}

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

// Mensaje del caso fallido: el paso que falló y el error en lenguaje
// entendible; el texto original de Katalon queda en la traza.
function failureDetails(tc, caseSteps) {
  if (!tc.message && !tc.trace) return {};
  const failed = caseSteps.find(step => step.status !== 'passed');
  // Las pruebas de estilos registran cada diferencia como aviso
  // (DIFERENCIA: elemento · propiedad: Figma x, medido y): son más claras que
  // el verifyEqual que falla.
  const differences = caseSteps
    .flatMap(step => step.steps.flatMap(action => action.steps ?? []))
    .map(warning => warning.name.match(/^⚠ DIFERENCIA: (.*)$/)?.[1])
    .filter(Boolean);
  const { message } = differences.length
    ? {
        message: `${differences.length} diferencia${differences.length > 1 ? 's' : ''} con Figma; la primera: ${differences[0]}.`,
      }
    : describeFailure(failed?.statusDetails?.trace || tc.message);
  return {
    message:
      failed && !differences.length ? `${failed.name}: ${message}` : message,
    trace: [tc.message, tc.trace].filter(Boolean).join('\n\n'),
  };
}
// Convierte una suite: su JUnit_Report.xml más el log, las capturas y los
// videos de su carpeta.
function convertSuite(junitPath) {
  const reportDir = dirname(junitPath);
  const { logs, media, attachments, apiEvidence } = reportEvidence(reportDir);
  const steps = stepsByCase(logs);

  const sharedLogs = logs.map(file => {
    const source = `${randomUUID()}-attachment.log`;
    copyFileSync(file, join(outDir, source));
    return { name: basename(file), source, type: 'text/plain' };
  });
  const usedMedia = new Set();

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

  // Request y response de la API de un caso, como un adjunto de texto.
  function attachApi(tc) {
    const text = apiEvidence.get(tc.name);
    if (!text) return [];
    const source = `${randomUUID()}-attachment.txt`;
    writeFileSync(join(outDir, source), text);
    return [{ name: 'API request y response', source, type: MIME['.txt'] }];
  }

  const cases = parseJUnit(readFileSync(junitPath, 'utf8'));
  const platform = platformOf(junitPath);
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
    const caseKey = createHash('md5')
      .update(`${tc.suite}|${tc.name}`)
      .digest('hex');
    const result = {
      uuid: randomUUID(),
      // Un mismo caso corre en varias suites (escritorio, móvil…): cada suite
      // tiene su propio historial.
      historyId: caseKey,
      // Allure agrupa por testCaseId (sale del fullName si falta): sin él, el
      // mismo caso en escritorio y en móvil se vería como un reintento.
      testCaseId: caseKey,
      name: tc.shortName,
      fullName: tc.name,
      status: tc.status,
      statusDetails: failureDetails(tc, steps.get(tc.name) ?? []),
      stage: 'finished',
      start: tc.start,
      stop: tc.stop,
      labels,
      steps: steps.get(tc.name) ?? [],
      links: spec.workItemUrl
        ? [{ name: `TC-${tc.tcId}`, url: spec.workItemUrl, type: 'tms' }]
        : [],
      attachments: [...attachApi(tc), ...attachMedia(tc), ...sharedLogs],
    };
    removePrevious(result.historyId);
    writeFileSync(
      join(outDir, `${result.uuid}-result.json`),
      JSON.stringify(result, null, 2)
    );
  }

  const unmatched = media.filter(file => !usedMedia.has(file));
  console.log(`Katalon → Allure: ${cases.length} casos desde ${junitPath}`);
  if (unmatched.length > 0) {
    console.log(
      `Evidencias sin caso asociado (no se adjuntaron):\n${unmatched
        .map(file => `  ${file}`)
        .join('\n')}`
    );
  }
}

for (const junitPath of suiteReports) convertSuite(junitPath);
console.log(`${suiteReports.length} suite(s) convertidas → ${outDir}/`);
