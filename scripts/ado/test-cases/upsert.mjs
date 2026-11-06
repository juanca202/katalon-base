#!/usr/bin/env node
// Crea o actualiza en Azure DevOps los Test Cases documentados en
// docs/specs (TC-<id>-<slug>.md generados por test-define), agrupados por su
// historia de usuario (US/WI/FT padre).
//
// Estructura que garantiza en el Test Plan:
//   Test Plan  →  suite raíz del plan  →  Suite «<US-id>: <título>»  →  Test Cases
// Primero resuelve el plan (lo crea si no existe). Cada historia cuelga como
// suite directamente de la suite raíz del plan (nombre = título del README.md
// de la historia) y, dentro de ella, crea o actualiza cada Test Case.
//
// Crear o actualizar:
//   - Con `Work Item (ADO): [#id](...)` en la cabecera del TC (o un archivo
//     TC-<id>-... con id de ADO de 4 o más dígitos sin ceros a la izquierda,
//     verificado como Test Case) se actualiza ese work item; solo se envían
//     los campos que cambiaron (título, pasos, prioridad, descripción).
//   - Sin id se crea el work item en la suite de su historia. El script NO
//     modifica archivos locales: al terminar imprime un JSON con el Test Plan
//     (testPlan.id, para ADO_TEST_PLAN_ID en .env) y el código de ADO (adoId,
//     adoCode, url) de cada TC para que el agente actualice el .env y el local
//     (id, título, nombre de archivo, work_item y enlaces).
//   - Los TC en estado Obsolete no se publican. La suite y el estado de un
//     Test Case existente no se modifican.
//
// Configuración: igual que scripts/ado/test-runs/publish.mjs (projectManagement de
// .sdd-devkit/settings.json y ADO_PAT). El PAT necesita los permisos Work
// Items (Read & write) y Test Management (Read & write).
//
// Uso: node scripts/ado/test-cases/upsert.mjs [opciones]
//   --specs <dir>         Carpeta de especificaciones (por defecto, changesPath
//                         y currentPath de .sdd-devkit/settings.json)
//   --plan <id>           Test Plan (o ADO_TEST_PLAN_ID); sin él se busca el plan
//                         con el nombre del proyecto y, si no existe, se crea
//   --only <id,id>        Solo esas historias (p. ej. US-003,WI-001)
//   --status <a,b>        Estados a publicar (por defecto Ready,Draft)
//   --dry-run             Muestra qué se haría sin llamar a Azure DevOps
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { createClient } from '../lib/client.mjs';
import {
  fail,
  loadAdoSettings,
  loadDotEnv,
  loadSettings,
} from '../lib/config.mjs';

const API = 'api-version=7.1';
const MAX_TITLE = 255;
const PRIORITY = { alta: 1, media: 2, baja: 3, high: 1, medium: 2, low: 3 };
const USAGE =
  'Uso: upsert.mjs [--specs <dir>] [--plan <id>] [--only <id,id>] [--status <a,b>] [--dry-run]';

function parseArgs(argv) {
  const args = {
    specs: null,
    plan: null,
    only: null,
    status: ['Ready', 'Draft'],
    dryRun: false,
  };
  const value = i => {
    if (argv[i + 1] === undefined)
      fail(`Falta el valor de ${argv[i]}.\n${USAGE}`);
    return argv[i + 1];
  };
  const list = text =>
    text
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--specs':
        args.specs = value(i++);
        break;
      case '--plan':
        args.plan = value(i++);
        break;
      case '--only':
        args.only = list(value(i++)).map(id => id.toUpperCase());
        break;
      case '--status':
        args.status = list(value(i++));
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      default:
        fail(`Argumento desconocido: ${argv[i]}\n${USAGE}`);
    }
  }
  return args;
}

// ── Lectura de las especificaciones ────────────────────────────────────────

function findTestCaseFiles(root) {
  const files = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'test-cases') {
          for (const file of readdirSync(path)) {
            if (/^TC-.+\.md$/.test(file)) files.push(join(path, file));
          }
        } else {
          walk(path);
        }
      }
    }
  };
  if (existsSync(root)) walk(root);
  return files;
}

const field = (text, label) =>
  text.match(
    new RegExp(`^\\*\\*${label}:\\*\\*[ \\t]*(.*?)[ \\t]*(?:<!--.*)?$`, 'm')
  )?.[1] ?? '';

// Frontmatter YAML plano del TC (claves simples y el objeto work_item).
function frontmatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
  if (!block) return {};
  const data = {};
  let parent = null;
  for (const line of block.split('\n')) {
    const nested = line.match(/^\s+([\w-]+):\s*(.*?)\s*$/);
    if (nested && parent) {
      data[parent][nested[1]] = nested[2].replace(/^"(.*)"$/, '$1');
      continue;
    }
    const top = line.match(/^([\w-]+):\s*(.*?)\s*(?:#.*)?$/);
    if (!top) continue;
    if (top[2] === '') {
      parent = top[1];
      data[parent] = {};
    } else {
      parent = null;
      data[top[1]] = top[2].replace(/^"(.*)"$/, '$1');
    }
  }
  return data;
}

const stripFrontmatter = text => text.replace(/^---\n[\s\S]*?\n---\n/, '');

function sections(text) {
  const result = {};
  for (const part of text.split(/^## /m).slice(1)) {
    const [heading, ...body] = part.split('\n');
    result[heading.trim().toLowerCase()] = body.join('\n').trim();
  }
  return result;
}

function parseSteps(table = '') {
  return table
    .split('\n')
    .filter(line => /^\|\s*\d+\s*\|/.test(line))
    .map(line => {
      const [, , actor, action, expected] = line
        .split('|')
        .map(cell => cell.trim());
      return {
        action: [actor && `${actor}:`, action].filter(Boolean).join(' '),
        expected: expected ?? '',
      };
    });
}

function parseTestCase(path) {
  const text = readFileSync(path, 'utf8');
  const meta = frontmatter(text);
  const heading = text.match(/^#\s+TC-(\S+)\s+[—–-]+\s+(.+?)\s*$/m);
  const workItemId =
    (meta.work_item?.id ?? '').match?.(/^\d+$/)?.[0] ??
    field(text, 'Work Item \\(ADO\\)').match(/#(\d+)/)?.[1];
  const fileId = basename(path).match(/^TC-([1-9]\d{3,})-/)?.[1];
  const body = sections(text);
  return {
    path,
    title: heading?.[2] ?? '',
    status: meta.status ?? field(text, 'Estado'),
    priority:
      PRIORITY[(meta.priority ?? field(text, 'Prioridad')).toLowerCase()] ?? 2,
    perspective: meta.perspective ?? field(text, 'Perspectiva'),
    criterion: meta.criterion ?? field(text, 'Criterio de aceptación'),
    parent: meta.parent ?? field(text, 'Artefacto padre'),
    workItemId: workItemId ? Number(workItemId) : null,
    fileId: fileId ? Number(fileId) : null,
    steps: parseSteps(body['pasos de ejecución']),
    body,
  };
}

// La historia es la carpeta que contiene test-cases/; su README.md da el
// título (nombre de la suite) y, si existe, su Work Item de ADO.
function readStory(storyDir) {
  const readme = join(storyDir, 'README.md');
  if (!existsSync(readme)) return null;
  const raw = readFileSync(readme, 'utf8');
  const text = stripFrontmatter(raw);
  const title = text.match(/^#\s+(.+?)\s*$/m)?.[1];
  if (!title) return null;
  const workItemId =
    frontmatter(raw).work_item?.id?.match(/^\d+$/)?.[0] ??
    field(text, 'Work Item \\(ADO\\)').match(/#(\d+)/)?.[1];
  return {
    dir: storyDir,
    title,
    key:
      title.match(/^(?:US|WI|FT)-[\w-]+?(?=[:\s]|$)/i)?.[0]?.toUpperCase() ??
      title,
    workItemId: workItemId ? Number(workItemId) : null,
  };
}

// ── Conversión a campos de Azure DevOps ────────────────────────────────────

const escapeHtml = text =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paragraph = text =>
  `<div>${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;

// Microsoft.VSTS.TCM.Steps: XML con un <step> por fila de la tabla de pasos.
function stepsXml(steps) {
  const items = steps.map(
    (step, index) =>
      `<step id="${index + 2}" type="ValidateStep"><parameterizedString isformatted="true">${escapeHtml(paragraph(step.action))}</parameterizedString><parameterizedString isformatted="true">${escapeHtml(paragraph(step.expected))}</parameterizedString><description/></step>`
  );
  return `<steps id="0" last="${steps.length + 1}">${items.join('')}</steps>`;
}

// Markdown simple (párrafos, listas y tablas) a HTML para el resumen.
const inline = text =>
  escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

function markdownToHtml(markdown = '') {
  const out = [];
  let list = [];
  let table = [];
  const flush = () => {
    if (list.length)
      out.push(`<ul>${list.map(i => `<li>${i}</li>`).join('')}</ul>`);
    if (table.length) {
      const rows = table
        .filter(row => !/^\|\s*-+/.test(row))
        .map((row, index) => {
          const cells = row
            .split('|')
            .slice(1, -1)
            .map(c => inline(c.trim()));
          const tag = index === 0 ? 'th' : 'td';
          return `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
        });
      out.push(`<table border="1">${rows.join('')}</table>`);
    }
    list = [];
    table = [];
  };
  for (const line of markdown.split('\n')) {
    if (line.startsWith('|')) {
      if (list.length) flush();
      table.push(line);
    } else if (/^[-*]\s+/.test(line)) {
      if (table.length) flush();
      list.push(inline(line.replace(/^[-*]\s+/, '')));
    } else {
      flush();
      if (line.trim()) out.push(`<div>${inline(line.trim())}</div>`);
    }
  }
  flush();
  return out.join('');
}

// Summary: todo el TC salvo los pasos (van en el campo Steps).
function descriptionHtml(tc) {
  const meta = [
    ['Perspectiva', tc.perspective],
    ['Criterio de aceptación', tc.criterion],
    ['Artefacto padre', tc.parent],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `<div><b>${label}:</b> ${escapeHtml(value)}</div>`)
    .join('');
  const detail = Object.entries(tc.body)
    .filter(([name]) => name !== 'pasos de ejecución')
    .map(
      ([name, content]) =>
        `<h3>${name[0].toUpperCase()}${name.slice(1)}</h3>${markdownToHtml(content)}`
    )
    .join('');
  return meta + detail;
}

const truncate = title =>
  title.length > MAX_TITLE ? `${title.slice(0, MAX_TITLE - 1)}…` : title;

function desiredFields(tc) {
  return {
    'System.Title': truncate(tc.title),
    'Microsoft.VSTS.TCM.Steps': stepsXml(tc.steps),
    'Microsoft.VSTS.Common.Priority': tc.priority,
    'System.Description': descriptionHtml(tc),
  };
}

// ── Ejecución ──────────────────────────────────────────────────────────────

loadDotEnv();
const args = parseArgs(process.argv.slice(2));
const settings = loadSettings();
const roots = args.specs
  ? [args.specs]
  : [
      settings.specification?.changesPath,
      settings.specification?.currentPath,
    ].filter(Boolean);

const stories = new Map();
const problems = [];
for (const file of roots.flatMap(findTestCaseFiles)) {
  const storyDir = dirname(dirname(file));
  if (!stories.has(storyDir)) {
    const story = readStory(storyDir);
    if (!story) {
      problems.push(`${file}: la historia no tiene README.md con título.`);
      continue;
    }
    stories.set(storyDir, { ...story, cases: [] });
  }
  const tc = parseTestCase(file);
  if (!tc.title || tc.steps.length === 0) {
    problems.push(
      `${file}: sin título «# TC-<id> — …» o sin pasos de ejecución.`
    );
    continue;
  }
  stories.get(storyDir).cases.push(tc);
}

const selected = [...stories.values()]
  .filter(story => !args.only || args.only.includes(story.key))
  .map(story => ({
    ...story,
    cases: story.cases.filter(tc => {
      if (tc.status === 'Obsolete') return false;
      return args.status.includes(tc.status);
    }),
  }))
  .filter(story => story.cases.length > 0);

for (const problem of problems) console.log(`Omitido: ${problem}`);
if (selected.length === 0) {
  fail(`No hay Test Cases para publicar en ${roots.join(', ')}.`);
}

const { orgUrl, project, workspace, baseUrl } = loadAdoSettings();

if (args.dryRun) {
  console.log(
    `[dry-run] Plan: ${args.plan ?? process.env.ADO_TEST_PLAN_ID ?? project}`
  );
  for (const story of selected) {
    console.log(`  Suite «${story.title}»`);
    for (const tc of story.cases) {
      const action =
        tc.workItemId || tc.fileId
          ? `actualizar #${tc.workItemId ?? tc.fileId} (alinea TC-${tc.workItemId ?? tc.fileId})`
          : 'crear';
      console.log(
        `    ${action}: ${tc.title} (${tc.status}, ${tc.steps.length} pasos)`
      );
    }
  }
  process.exit(0);
}

const client = createClient({
  baseUrl,
  workspace,
  permission: 'Work Items y Test Management (Read & write)',
});
const ado = (method, path, body) => client.json(method, path, body);
const patch = (method, path, ops) =>
  client.json(method, path, ops, 'application/json-patch+json');

let planCreated = false;

async function resolvePlan() {
  const id = Number(args.plan ?? process.env.ADO_TEST_PLAN_ID);
  if (id) return ado('GET', `/testplan/plans/${id}?${API}`);
  const plans = (await ado('GET', `/testplan/plans?${API}`)).value;
  const existing = plans.find(plan => plan.name === project);
  if (existing) return existing;
  console.log(`Creando Test Plan «${project}»`);
  planCreated = true;
  return ado('POST', `/testplan/plans?${API}`, { name: project });
}

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

// Reutiliza la suite si ya existe con ese nombre bajo el padre; si no, la crea.
async function ensureSuite(planId, suites, name, parentId) {
  const existing = suites.find(
    suite => suite.name === name && suite.parentSuite?.id === parentId
  );
  if (existing) return existing;
  console.log(`Creando suite «${name}»`);
  const created = await ado('POST', `/testplan/Plans/${planId}/suites?${API}`, {
    suiteType: 'staticTestSuite',
    name,
    parentSuite: { id: parentId },
  });
  suites.push(created);
  return created;
}

async function createTestCase(tc, story, planId, suiteId) {
  const ops = Object.entries(desiredFields(tc)).map(([name, value]) => ({
    op: 'add',
    path: `/fields/${name}`,
    value,
  }));
  if (story.workItemId) {
    ops.push({
      op: 'add',
      path: '/relations/-',
      value: {
        rel: 'Microsoft.VSTS.Common.TestedBy-Reverse',
        url: `${orgUrl}/_apis/wit/workItems/${story.workItemId}`,
      },
    });
  }
  const item = await patch('POST', `/wit/workitems/$Test%20Case?${API}`, ops);
  await ado(
    'POST',
    `/test/Plans/${planId}/suites/${suiteId}/testcases/${item.id}?${API}`
  );
  return item;
}

// Devuelve true si hubo cambios. Solo envía los campos distintos.
async function updateTestCase(tc, id) {
  const current = await ado('GET', `/wit/workitems/${id}?${API}`);
  if (current.fields['System.WorkItemType'] !== 'Test Case') {
    throw new Error(
      `#${id} es «${current.fields['System.WorkItemType']}», no un Test Case.`
    );
  }
  const ops = Object.entries(desiredFields(tc))
    .filter(
      ([name, value]) => String(current.fields[name] ?? '') !== String(value)
    )
    .map(([name, value]) => ({ op: 'add', path: `/fields/${name}`, value }));
  if (ops.length === 0) return false;
  await patch('PATCH', `/wit/workitems/${id}?${API}`, ops);
  return true;
}

const plan = await resolvePlan();
const suites = await listSuites(plan.id);
console.log(`Test Plan ${plan.id} «${plan.name}»`);

// Resultado para el agente: el script NO modifica archivos locales. Por cada
// Test Case devuelve el código de ADO para que el agente actualice el local
// (id del frontmatter, título, nombre del archivo, bloque work_item y enlaces
// del índice y de la historia).
const results = [];
const adoUrl = id =>
  `${orgUrl}/${encodeURIComponent(project)}/_workitems/edit/${id}`;
let failures = 0;
for (const story of selected) {
  const suite = await ensureSuite(
    plan.id,
    suites,
    story.title,
    plan.rootSuite.id
  );
  const count = { creados: 0, actualizados: 0, 'sin cambios': 0 };
  for (const tc of story.cases) {
    try {
      const existing = tc.workItemId ?? tc.fileId;
      let id = existing;
      let action = 'unchanged';
      if (existing) {
        if (await updateTestCase(tc, existing)) action = 'updated';
      } else {
        const created = await createTestCase(tc, story, plan.id, suite.id);
        id = created.id;
        action = 'created';
        console.log(`  Creado #${id}: ${tc.title}`);
      }
      count[
        {
          created: 'creados',
          updated: 'actualizados',
          unchanged: 'sin cambios',
        }[action]
      ]++;
      const localId = basename(tc.path).match(/^(TC-[^-]+)-/)?.[1];
      results.push({
        story: story.key,
        storyDir: story.dir,
        file: tc.path,
        localId,
        adoId: id,
        adoCode: `TC-${id}`,
        url: adoUrl(id),
        action,
        needsLocalUpdate: localId !== `TC-${id}` || !tc.workItemId,
      });
    } catch (error) {
      failures++;
      console.error(`  Error en ${tc.path}: ${error.message}`);
    }
  }
  console.log(
    `${story.title}: ${count.creados} creados, ${count.actualizados} actualizados, ${count['sin cambios']} sin cambios`
  );
}

console.log(
  '\nRESULTADO (JSON): códigos de ADO para actualizar los archivos locales'
);
const testPlan = {
  id: plan.id,
  name: plan.name,
  created: planCreated,
  envVar: 'ADO_TEST_PLAN_ID',
  needsEnvUpdate:
    String(process.env.ADO_TEST_PLAN_ID ?? '') !== String(plan.id),
};
console.log(JSON.stringify({ testPlan, testCases: results }, null, 2));
if (testPlan.needsEnvUpdate) {
  console.log(
    `\nEl script no modificó .env. Actualiza ADO_TEST_PLAN_ID=${plan.id} en .env (Test Plan «${plan.name}»${planCreated ? ', recién creado' : ''}).`
  );
}
if (results.some(r => r.needsLocalUpdate)) {
  console.log(
    '\nEl script no modificó ningún archivo local. Actualiza los marcados con needsLocalUpdate antes de volver a ejecutarlo; de lo contrario se crearían duplicados.'
  );
}
if (failures) process.exit(1);
