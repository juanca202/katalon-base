// Lectura común del reporte de una ejecución de Katalon Studio:
// tests/katalon/Reports/<fecha>/<suite>/<fecha>/JUnit_Report.xml, más el log,
// las capturas y los videos de esa carpeta. La usan la conversión a Allure
// (ADR-004) y la publicación en Azure DevOps (ADR-006).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

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
};

const MEDIA = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.avi',
  '.mov',
  '.mp4',
  '.webm',
]);

export function walk(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
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
    media: files.filter(file => MEDIA.has(extname(file).toLowerCase())),
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
