#!/usr/bin/env node
// Borra Test Cases de Azure DevOps. Quitar una suite del Test Plan no elimina
// los work items, y la API de work items rechaza los Test Cases. Este script
// usa la de Test Management (DELETE /test/testcases/{id}), que sí los elimina.
//
// Se pueden indicar ids sueltos, un Test Plan (todos los casos de sus suites)
// o ambos. Un caso presente en varias suites se borra una sola vez. El plan
// no se toma de ADO_TEST_PLAN_ID: hay que pasarlo con --plan.
//
// Configuración: igual que el resto de scripts/ado (projectManagement de
// .sdd-devkit/settings.json y ADO_PAT). El PAT necesita Test Management
// (Read & write).
//
// Uso: node scripts/ado/test-cases/delete.mjs [opciones] [<id>...]
//   --plan <id>   Borra los Test Cases de ese Test Plan
//   <id>          Uno o más Test Cases (1234, #1234 o TC-1234)
//   --dry-run     Lista lo que se borraría, sin eliminar
import { createClient } from '../lib/client.mjs';
import { fail, loadAdoSettings, loadDotEnv } from '../lib/config.mjs';

const API = 'api-version=7.1';
const PAGE = 200;
const TEST_CASE_TYPES = new Set(['Test Case', 'Caso de prueba']);
const USAGE =
  'Uso: delete.mjs [--plan <id>] [<id>...] [--dry-run]\n' +
  '  <id> admite 1234, #1234 o TC-1234.';

function parseArgs(argv) {
  const args = { plan: null, ids: [], dryRun: false };
  const value = i => {
    if (argv[i + 1] === undefined)
      fail(`Falta el valor de ${argv[i]}.\n${USAGE}`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--plan':
        args.plan = value(i++);
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      default:
        if (argv[i].startsWith('--'))
          fail(`Opción desconocida: ${argv[i]}\n${USAGE}`);
        args.ids.push(argv[i]);
    }
  }
  return args;
}

function testCaseId(token) {
  const id = token.replace(/^#/, '').replace(/^TC-/i, '');
  if (!/^\d+$/.test(id)) fail(`No es un id de Test Case: ${token}\n${USAGE}`);
  return Number(id);
}

loadDotEnv();
const args = parseArgs(process.argv.slice(2));
const ids = [...new Set(args.ids.map(testCaseId))];
if (args.plan !== null && !/^\d+$/.test(args.plan)) {
  fail(`No es un id de Test Plan: ${args.plan}\n${USAGE}`);
}
if (args.plan === null && ids.length === 0) fail(USAGE);

const { baseUrl, workspace } = loadAdoSettings();
const client = createClient({
  baseUrl,
  workspace,
  permission: 'Test Management (Read & write)',
});
const ado = (method, path, body) => client.json(method, path, body);

async function listSuites(planId) {
  const suites = [];
  let token = null;
  do {
    const response = await client.send(
      'GET',
      `/testplan/Plans/${planId}/suites?${API}${token ? `&continuationToken=${token}` : ''}`
    );
    suites.push(...(await response.json()).value);
    token = response.headers.get('x-ms-continuationtoken');
  } while (token);
  return suites;
}

// Los casos de una suite. workItem trae el id del Test Case; testCase es el
// respaldo cuando la respuesta no incluye el work item.
async function casesInSuite(planId, suiteId) {
  const cases = [];
  let token = null;
  do {
    const response = await client.send(
      'GET',
      `/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?${API}${token ? `&continuationToken=${token}` : ''}`
    );
    const body = await response.json();
    for (const item of body.value ?? []) {
      const ref = item.workItem ?? item.testCase;
      if (ref?.id) cases.push({ id: ref.id, title: ref.name ?? '' });
    }
    token = response.headers.get('x-ms-continuationtoken');
  } while (token);
  return cases;
}

// Título y tipo de los ids indicados. Los que no existen no vienen en la
// respuesta (errorPolicy=Omit).
async function describe(workItemIds) {
  const found = new Map();
  for (let i = 0; i < workItemIds.length; i += PAGE) {
    const chunk = workItemIds.slice(i, i + PAGE);
    const query = [
      `ids=${chunk.join(',')}`,
      'fields=System.Id,System.Title,System.WorkItemType',
      'errorPolicy=Omit',
      API,
    ].join('&');
    const body = await ado('GET', `/wit/workitems?${query}`);
    for (const item of body.value ?? []) {
      found.set(item.id, {
        id: item.id,
        title: item.fields['System.Title'] ?? '',
        type: item.fields['System.WorkItemType'],
      });
    }
  }
  return found;
}

const selected = new Map();
const problems = [];

let plan = null;
if (args.plan !== null) {
  plan = await ado('GET', `/testplan/plans/${args.plan}?${API}`);
  for (const suite of await listSuites(plan.id)) {
    for (const tc of await casesInSuite(plan.id, suite.id)) {
      selected.set(tc.id, tc);
    }
  }
}

if (ids.length > 0) {
  const pending = ids.filter(id => !selected.has(id));
  const described = await describe(pending);
  for (const id of pending) {
    const item = described.get(id);
    if (!item) {
      problems.push(`#${id}: no existe.`);
      continue;
    }
    if (!TEST_CASE_TYPES.has(item.type)) {
      problems.push(`#${id} es «${item.type}», no un Test Case.`);
      continue;
    }
    selected.set(id, { id, title: item.title });
  }
}

const cases = [...selected.values()].sort((a, b) => a.id - b.id);
if (plan) {
  console.log(
    `${args.dryRun ? '[dry-run] ' : ''}Test Plan ${plan.id} «${plan.name}»`
  );
} else if (args.dryRun) {
  console.log('[dry-run]');
}
for (const problem of problems) console.log(`Omitido: ${problem}`);
if (cases.length === 0 && problems.length === 0) {
  console.log('No hay Test Cases para borrar.');
  process.exit(0);
}
for (const tc of cases) console.log(`  #${tc.id} ${tc.title}`);
if (args.dryRun) process.exit(problems.length > 0 ? 1 : 0);

let deleted = 0;
let failures = problems.length;
for (const tc of cases) {
  try {
    await ado('DELETE', `/test/testcases/${tc.id}?${API}`);
    deleted++;
    console.log(`Eliminado #${tc.id}: ${tc.title}`);
  } catch (error) {
    failures++;
    console.error(`Error #${tc.id}: ${error.message}`);
  }
}
console.log(`Eliminados: ${deleted}. Errores: ${failures}`);
if (failures > 0) process.exit(1);
