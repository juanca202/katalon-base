// Lectura común del reporte de una ejecución de Katalon Studio:
// tests/katalon/Reports/<fecha>/<suite>/<fecha>/JUnit_Report.xml, más el log,
// las capturas y los videos de esa carpeta. La usan la conversión a Allure
// (ADR-004) y la publicación en Azure DevOps (ADR-006).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

export const REPORTS_DIR = 'tests/katalon/Reports';

export const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.log': 'text/plain',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.html': 'text/html',
};

// Evidencia que se adjunta al caso cuyo TC-<id> o nombre aparece en la ruta.
// Incluye los reportes HTML que generan las pruebas (p. ej. la comparación de
// estilos con Figma); el reporte propio de Katalon no lleva el TC en el nombre.
const MEDIA = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.avi',
  '.mov',
  '.mp4',
  '.webm',
  '.html',
]);

export function walk(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
}

// JUnit_Report.xml de cada suite de una ejecución. Una colección (Test Suite
// Collection) escribe un JUnit por suite, cada uno junto a su log, capturas y
// videos, y otro de resumen sin evidencias: ese se descarta.
//   - Sin argumento: todas las suites de la ejecución más reciente.
//   - Con una carpeta: todas las suites que contiene.
//   - Con un JUnit: ese; si es el resumen de una colección, sus suites.
const isSuiteReport = file =>
  readdirSync(dirname(file)).some(name => /^execution\d*\.log$/.test(name));

export function resolveSuiteReports(arg) {
  const junitsIn = dir =>
    walk(dir)
      .filter(file => basename(file) === 'JUnit_Report.xml')
      .filter(isSuiteReport)
      .sort();
  if (arg) {
    const path = resolve(arg);
    if (!existsSync(path)) return [];
    if (statSync(path).isDirectory()) return junitsIn(path);
    if (isSuiteReport(path)) return [path];
    // Resumen de una colección: Reports/<fecha>/<carpeta>/<colección>/<fecha>/
    return junitsIn(dirname(dirname(dirname(path))));
  }
  const latest = resolveJUnit();
  if (!latest) return [];
  // Reports/<fecha>/…: la carpeta de primer nivel agrupa toda la ejecución.
  const execution = join(
    REPORTS_DIR,
    resolve(latest)
      .slice(resolve(REPORTS_DIR).length + 1)
      .split(/[\\/]/)[0]
  );
  return junitsIn(execution);
}

// Ruta del JUnit_Report.xml indicado o, si no se indica, del más reciente.
export function resolveJUnit(junitArg) {
  if (junitArg) return resolve(junitArg);
  if (!existsSync(REPORTS_DIR)) return null;
  const reports = walk(REPORTS_DIR).filter(
    file => basename(file) === 'JUnit_Report.xml'
  );
  reports.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return reports[0] ?? null;
}

const decode = text =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '\r')
    .replace(/&amp;/g, '&');

// Nombre legible de un Test Object: la primera frase de su descripción en el
// Object Repository (p. ej. «Botón 'View demo' de /auth»), con el id del objeto.
const KATALON_DIR = 'tests/katalon';
const objectLabels = new Map();
function objectLabel(id) {
  if (!objectLabels.has(id)) {
    const file = join(KATALON_DIR, `${id}.rs`);
    const description = existsSync(file)
      ? decode(
          readFileSync(file, 'utf8').match(
            /<description>([^<]*)<\/description>/
          )?.[1] ?? ''
        )
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
            String.fromCodePoint(parseInt(hex, 16))
          )
          .split(/(?<=[.:])\s|\s\(/)[0]
          .replace(/[.:]$/, '')
          .trim()
      : '';
    const name = id.split('/').pop();
    objectLabels.set(
      id,
      description ? `«${description}» (${name})` : `«${name}»`
    );
  }
  return objectLabels.get(id);
}

// Traduce los errores de Katalon a una frase entendible. El texto original,
// con la causa y la traza, se conserva aparte (statusDetails.trace).
const FRIENDLY_ERRORS = [
  [
    /Web element with id: '([^']+)' located by .* not found/,
    ([, id]) => `No se encontró en la página ${objectLabel(id)}.`,
  ],
  [
    /Unable to verify object '([^']+)' is visible|Object '([^']+)' is not visible/,
    ([, a, b]) => `${objectLabel(a ?? b)} no está visible.`,
  ],
  [
    /Object '([^']+)' is (?:still )?present|Unable to verify object '([^']+)' is not present/,
    ([, a, b]) => `${objectLabel(a ?? b)} sigue en la página y no debería.`,
  ],
  [
    /(?:Unable to verify equal between actual object|Actual object) '(.*?)' and expected object '(.*?)'/,
    ([, actual, expected]) =>
      `Se esperaba «${expected}» y se obtuvo «${actual}».`,
  ],
  [
    /Actual text '(.*?)' and expected text '(.*?)' are not matched\s+using regular expression/,
    ([, actual, expected]) =>
      `El valor «${actual}» no cumple el patrón esperado «${expected}».`,
  ],
  [
    /Actual text '(.*?)' and expected text '(.*?)' are not matched/,
    ([, actual, expected]) =>
      `Se esperaba el texto «${expected}» y se obtuvo «${actual}».`,
  ],
  [
    /actual number '(.*?)' less than or equal to expected number '(.*?)'/,
    ([, actual, limit]) =>
      `El valor obtenido (${actual}) supera el máximo permitido (${limit}).`,
  ],
  [
    /actual number '(.*?)' greater than or equal to expected number '(.*?)'/,
    ([, actual, limit]) =>
      `El valor obtenido (${actual}) es menor que el mínimo esperado (${limit}).`,
  ],
  [
    /Expected status code is '(\d+)' but found '(\d+)'/,
    ([, expected, actual]) =>
      `La API respondió ${actual} y se esperaba ${expected}.`,
  ],
  [
    /Unable to navigate to '(.*?)'/,
    ([, url]) =>
      url.startsWith('null')
        ? `No se pudo abrir «${url}»: falta la URL base en el Execution Profile.`
        : `No se pudo abrir la página «${url}».`,
  ],
];

export function describeFailure(raw) {
  const text = (raw ?? '').trim();
  if (!text) return { message: '', trace: '' };
  for (const [pattern, explain] of FRIENDLY_ERRORS) {
    const match = text.match(pattern);
    if (match) return { message: explain(match), trace: text };
  }
  // Sin traducción: la primera línea, sin la causa repetida ni la traza.
  const first = text.split('\n')[0].replace(/\s*\(Root cause:.*$/, '');
  return { message: first, trace: text };
}

const attrs = tag => {
  const found = {};
  for (const [, key, value] of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    found[key] = decode(value);
  }
  return found;
};

// Lee los <testcase> de cada <testsuite> del JUnit de Katalon. Cada caso trae
// su nombre completo, el nombre corto, el TC-<id> si lo declara, el estado
// (passed, failed, broken o skipped), el error y los tiempos.
export function parseJUnit(xml) {
  const cases = [];
  for (const [, suiteTag, suiteBody] of xml.matchAll(
    /<testsuite\b([^>]*)>([\s\S]*?)<\/testsuite>/g
  )) {
    const suite = attrs(suiteTag);
    const suiteStart = Date.parse(suite.timestamp ?? '') || Date.now();
    let offset = 0;
    for (const match of suiteBody.matchAll(
      /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g
    )) {
      const tc = attrs(match[1]);
      const body = match[2] ?? '';
      const durationMs = Math.round(Number(tc.time ?? 0) * 1000);
      const problem = body.match(
        /<(failure|error)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/
      );
      let status = (tc.status ?? '').toLowerCase();
      if (!['passed', 'failed', 'broken', 'skipped'].includes(status)) {
        if (/<skipped\b/.test(body)) status = 'skipped';
        else if (problem?.[1] === 'failure') status = 'failed';
        else if (problem) status = 'broken';
        else status = 'passed';
      }
      if (status === 'error') status = 'broken';
      const name = tc.name ?? 'sin nombre';
      const shortName = name.split('/').pop();
      cases.push({
        name,
        shortName,
        tcId: shortName.match(/^TC-(\d+)/)?.[1] ?? null,
        suite: suite.name ?? '',
        status,
        message: problem ? (attrs(problem[2]).message ?? '') : '',
        trace: problem?.[3] ? decode(problem[3]).trim() : '',
        start: suiteStart + offset,
        stop: suiteStart + offset + durationMs,
        durationMs,
      });
      offset += durationMs;
    }
  }
  return cases;
}

// Adjuntos que el log de la ejecución registra en cada caso: las capturas se
// nombran con un timestamp (p. ej. 1793065248196.png), así que su caso solo
// se conoce por el bloque "Start Test Case" del log en el que aparecen.
function attachmentsByCase(logs) {
  const byCase = new Map();
  let current = null;
  for (const log of logs) {
    for (const [, start, attachment] of readFileSync(log, 'utf8').matchAll(
      /<message>Start Test Case : ([^<]+)<\/message>|<property name="attachment">([^<]+)<\/property>/g
    )) {
      if (start) {
        current = decode(start).trim();
        if (!byCase.has(current)) byCase.set(current, new Set());
      } else if (current) {
        byCase.get(current).add(decode(attachment).trim());
      }
    }
  }
  return byCase;
}

// Pasos de cada caso para Allure, a partir de los registros <record> del log.
// Cada acción del script es un paso; la que lleva descripción (el comentario
// 'Paso N: …' que la precede en el script) abre un paso padre con ese nombre, y
// las acciones siguientes sin descripción quedan dentro de él. Las acciones del
// listener, las internas de los keywords y los findTestObject() no se listan. Una acción con un
// registro FAILED queda en failed (ERROR en broken), con su mensaje; los avisos
// (markWarning) se muestran como subpasos. Las declaraciones sueltas que no
// pertenecen a ningún paso (obj = …, TIMEOUT = 10) se omiten si pasaron.
const RANK = { passed: 0, broken: 1, failed: 2 };
const worse = (a, b) => (RANK[b] > RANK[a] ? b : a);

export function stepsByCase(logs) {
  const byCase = new Map();
  for (const log of logs) {
    let steps = null;
    let caseLevel = 0;
    let inListener = false;
    let group = null;
    let action = null;
    // Bloques try/finally del script: sus acciones van un nivel más adentro,
    // pero son pasos del caso igual que las de fuera.
    let depth = 0;
    for (const [, record] of readFileSync(log, 'utf8').matchAll(
      /<record>([\s\S]*?)<\/record>/g
    )) {
      const field = name =>
        record.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? '';
      const level = field('level');
      const nested = Number(field('nestedLevel'));
      const millis = Number(field('millis'));
      // El log escapa el XML dos veces (&amp;quot;): se decodifica dos veces
      const message = decode(decode(field('message'))).trim();
      const description = record.match(
        /<property name="description">([^<]*)<\/property>/
      )?.[1];
      if (message.startsWith('Start Test Case : ')) {
        steps = [];
        byCase.set(message.slice(18).trim(), steps);
        caseLevel = nested;
        depth = 0;
        group = null;
        action = null;
      } else if (!steps || message.startsWith('End Test Case : ')) {
        steps = message.startsWith('End Test Case : ') ? null : steps;
      } else if (message.startsWith('Start listener action')) {
        inListener = true;
      } else if (message.startsWith('End listener action')) {
        inListener = false;
      } else if (inListener) {
        continue;
      } else if (
        level === 'START' &&
        nested === caseLevel + depth &&
        /^Start action : (try|finally|catch\b)/.test(message)
      ) {
        action = null;
        depth++;
      } else if (
        depth > 0 &&
        level === 'END' &&
        nested === caseLevel + depth - 1
      ) {
        depth--;
      } else if (
        level === 'START' &&
        nested === caseLevel + depth &&
        !message.startsWith('Start action : findTestObject(') &&
        message.startsWith('Start action : ') &&
        message !== 'Start action : Video'
      ) {
        action = {
          name: message.replace(/^Start action : /, ''),
          status: 'passed',
          stage: 'finished',
          start: millis,
          stop: millis,
          steps: [],
        };
        if (description) {
          group = {
            ...action,
            name: decode(decode(description)).trim(),
            steps: [action],
          };
          steps.push(group);
        } else if (group) {
          group.steps.push(action);
        } else {
          steps.push(action);
        }
      } else if (action && level === 'END' && nested === caseLevel + depth) {
        action.stop = millis;
        if (group) group.stop = millis;
        action = null;
      } else if (
        (level === 'FAILED' || level === 'ERROR' || level === 'WARNING') &&
        !message.startsWith('Test Cases/')
      ) {
        // Katalon registra a veces el fallo después de cerrar la acción (p. ej.
        // dentro de un closure): se atribuye a la última acción del paso.
        const owner = action ?? group?.steps.at(-1) ?? group;
        if (!owner) continue;
        if (level === 'WARNING') {
          owner.steps.push({
            name: `⚠ ${message}`,
            status: 'passed',
            stage: 'finished',
            start: millis,
            stop: millis,
          });
          continue;
        }
        owner.status = worse(
          owner.status,
          level === 'FAILED' ? 'failed' : 'broken'
        );
        owner.statusDetails ??= describeFailure(message);
        if (group && group !== owner) {
          group.status = worse(group.status, owner.status);
          group.statusDetails ??= describeFailure(message);
        }
      }
    }
  }
  // Las declaraciones sueltas del inicio del script (obj = …, TIMEOUT = 10)
  // no son pasos del caso: se omiten si pasaron.
  for (const [name, steps] of byCase)
    byCase.set(
      name,
      steps.filter(
        step =>
          step.steps.length > 0 ||
          step.status !== 'passed' ||
          !/^[\w.]+ = /.test(step.name)
      )
    );
  return byCase;
}

// Request y response de las llamadas API: el keyword ApiRequest.send() los
// registra en el log con los prefijos [API-REQUEST] y [API-RESPONSE] (ADR-003).
// Se agrupan por caso y se devuelven como texto, en orden de ejecución.
function apiEvidenceByCase(logs) {
  const byCase = new Map();
  let current = null;
  for (const log of logs) {
    for (const [, start, message] of readFileSync(log, 'utf8').matchAll(
      /<message>Start Test Case : ([^<]+)<\/message>|<message>(\[API-(?:REQUEST|RESPONSE)\][\s\S]*?)<\/message>/g
    )) {
      if (start) {
        current = decode(start).trim();
      } else if (current) {
        const text = decode(message).trim();
        byCase.set(current, [...(byCase.get(current) ?? []), text]);
      }
    }
  }
  return new Map(
    [...byCase].map(([name, entries]) => [name, entries.join('\n\n---\n\n')])
  );
}

// Archivos de evidencia de la carpeta del reporte.
export function reportEvidence(reportDir) {
  const files = walk(reportDir);
  const logs = files
    .filter(file => /^execution\d*\.log$/.test(basename(file)))
    .sort(
      (a, b) =>
        Number(basename(a).match(/\d+/)?.[0] ?? 0) -
        Number(basename(b).match(/\d+/)?.[0] ?? 0)
    );
  return {
    logs,
    // El reporte HTML propio de Katalon (<fecha>.html) no es evidencia de un caso
    media: files.filter(
      file =>
        MEDIA.has(extname(file).toLowerCase()) &&
        !/^\d{8}_\d{6}\.html$/.test(basename(file))
    ),
    attachments: attachmentsByCase(logs),
    apiEvidence: apiEvidenceByCase(logs),
  };
}

// Capturas y videos de un caso: los que llevan su TC-<id> o su nombre en la
// ruta, y los que el log registra como adjuntos del caso.
export function mediaForCase(media, reportDir, tc, attachments = new Map()) {
  const logged = attachments.get(tc.name) ?? new Set();
  return media.filter(file => {
    const rel = file.slice(reportDir.length);
    return (
      (tc.tcId && rel.includes(`TC-${tc.tcId}`)) ||
      rel.includes(tc.shortName) ||
      logged.has(basename(file))
    );
  });
}
