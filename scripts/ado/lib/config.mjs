// Configuración compartida de los scripts de Azure DevOps: lectura de .env,
// settings del proyecto (projectManagement de .sdd-devkit/settings.json) y
// autenticación con PAT.
import { existsSync, readFileSync } from 'node:fs';

// El .env es configuración del proyecto: sus valores no vacíos prevalecen
// sobre las variables globales del shell (p. ej. un ADO_PAT de otra
// organización). Admite referencias a otras variables: ADO_PAT=${ADO_PAT_ORG}.
export function loadDotEnv(path = '.env') {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const value = match[2]
      .replace(/^(['"])(.*)\1$/, '$2')
      .replace(/\$\{(\w+)\}|\$(\w+)/g, (_, a, b) => process.env[a ?? b] ?? '');
    if (value) process.env[match[1]] = value;
  }
}

export function fail(message) {
  console.error(message);
  process.exit(2);
}

export function loadSettings(path = '.sdd-devkit/settings.json') {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Devuelve { orgUrl, project, workspace, baseUrl }; `project` permite
// sobrescribir el de los settings.
export function loadAdoSettings({ project } = {}) {
  const pm = loadSettings().projectManagement ?? {};
  if (!pm.enabled || pm.provider !== 'azure-devops') {
    fail(
      'projectManagement de .sdd-devkit/settings.json no apunta a Azure DevOps.'
    );
  }
  // `host` puede venir con o sin la organización (dev.azure.com[/<org>]).
  const host = pm.host.replace(/\/+$/, '');
  const orgUrl = host.endsWith(`/${pm.workspace}`)
    ? host
    : `${host}/${encodeURIComponent(pm.workspace)}`;
  const name = project ?? pm.project;
  return {
    orgUrl,
    project: name,
    workspace: pm.workspace,
    baseUrl: `${orgUrl}/${encodeURIComponent(name)}/_apis`,
  };
}

// ADO_PAT admite el PAT tal cual o ya codificado como base64(":<PAT>"), que es
// el formato que espera el MCP de Azure DevOps.
export function basicAuth(pat) {
  const decoded = Buffer.from(pat, 'base64').toString('utf8');
  const preEncoded =
    /^[^:\s]*:[A-Za-z0-9]+$/.test(decoded) &&
    Buffer.from(decoded).toString('base64') === pat;
  return `Basic ${preEncoded ? pat : Buffer.from(`:${pat}`).toString('base64')}`;
}
