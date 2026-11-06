#!/usr/bin/env node
// Descarga work items de Azure DevOps (historia, bug, task, test case...) con
// la misma funcionalidad que las herramientas wit_work_item y
// wit_work_item_attachment del MCP de Azure DevOps: get / get_batch,
// list_comments, list_revisions y descarga de adjuntos.
//
// Configuración: igual que scripts/ado/test-runs/publish.mjs (projectManagement de
// .sdd-devkit/settings.json y ADO_PAT del entorno o .env). El PAT necesita
// el permiso Work Items (Read).
//
// Uso: node scripts/ado/work-items/get.mjs <id> [<id>...] [opciones]
//   Los IDs admiten el formato 1234, #1234 o TC-1234 (varios = get_batch).
//
// Opciones:
//   --project <nombre>   Proyecto (por defecto, el de .sdd-devkit/settings.json)
//   --expand <valor>     None | Relations | Fields | Links | All (por defecto All)
//   --fields <a,b,...>   Solo esos campos (p. ej. System.Title,System.State);
//                        no se combina con --expand y no descarga adjuntos
//   --as-of <fecha>      Versión del work item a esa fecha (ISO 8601)
//   --comments           Descarga también los comentarios
//   --revisions          Descarga también las revisiones
//   --top <n> --skip <n> Paginación de comentarios (top) y revisiones (top, skip);
//                        sin --top se descargan todos
//   --no-attachments     No descarga los adjuntos
//   --out <directorio>   Destino (por defecto .tmp/work-items)
//
// Escribe en <out>/<id>/:
//   work-item.json  respuesta completa de la API
//   comments.json   con --comments
//   revisions.json  con --revisions
//   attachments/    archivos adjuntos (descargados por su GUID)
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { createClient } from '../lib/client.mjs';
import { fail, loadAdoSettings, loadDotEnv } from '../lib/config.mjs';

const API = 'api-version=7.1';
const API_COMMENTS = 'api-version=7.1-preview.4';
const EXPANDS = ['None', 'Relations', 'Fields', 'Links', 'All'];
const PAGE = 200;
const USAGE =
  'Uso: get.mjs <id> [<id>...] [--project <p>] [--expand <e>] [--fields <a,b>] [--as-of <fecha>] [--comments] [--revisions] [--top <n>] [--skip <n>] [--no-attachments] [--out <dir>]';

function parseArgs(argv) {
  const args = {
    ids: [],
    project: null,
    expand: null,
    fields: null,
    asOf: null,
    comments: false,
    revisions: false,
    top: null,
    skip: 0,
    attachments: true,
    out: '.tmp/work-items',
  };
  const value = i => {
    if (argv[i + 1] === undefined)
      fail(`Falta el valor de ${argv[i]}.\n${USAGE}`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--project':
        args.project = value(i++);
        break;
      case '--expand':
        args.expand = value(i++);
        break;
      case '--fields':
        args.fields = value(i++)
          .split(',')
          .map(field => field.trim())
          .filter(Boolean);
        break;
      case '--as-of':
        args.asOf = value(i++);
        break;
      case '--comments':
        args.comments = true;
        break;
      case '--revisions':
        args.revisions = true;
        break;
      case '--top':
        args.top = Number(value(i++));
        break;
      case '--skip':
        args.skip = Number(value(i++));
        break;
      case '--no-attachments':
        args.attachments = false;
        break;
      case '--out':
        args.out = value(i++);
        break;
      default:
        if (argv[i].startsWith('--'))
          fail(`Opción desconocida: ${argv[i]}\n${USAGE}`);
        args.ids.push(argv[i].replace(/^#|^(WI|TC|US|BUG)-/i, ''));
    }
  }
  return args;
}

loadDotEnv();
const args = parseArgs(process.argv.slice(2));
if (args.ids.length === 0 || args.ids.some(id => !/^\d+$/.test(id))) {
  fail(USAGE);
}
if (args.fields && args.expand) {
  fail('--fields no se puede combinar con --expand.');
}
if (args.expand && !EXPANDS.includes(args.expand)) {
  fail(`--expand debe ser uno de: ${EXPANDS.join(', ')}.`);
}
if (
  [args.top, args.skip].some(n => n !== null && (!Number.isInteger(n) || n < 0))
) {
  fail('--top y --skip deben ser enteros positivos.');
}
const { workspace, baseUrl } = loadAdoSettings({
  project: args.project,
});
const client = createClient({
  baseUrl,
  workspace,
  permission: 'Work Items (Read)',
});
// Sin --fields se expande todo por defecto; los adjuntos requieren relaciones.
const expand = args.fields ? null : (args.expand ?? 'All');
const hasRelations = expand === 'All' || expand === 'Relations';

const getJson = url => client.json('GET', url);

function itemUrl(id) {
  const query = [API];
  if (args.fields)
    query.push(`fields=${encodeURIComponent(args.fields.join(','))}`);
  else if (expand) query.push(`$expand=${expand}`);
  if (args.asOf) query.push(`asOf=${encodeURIComponent(args.asOf)}`);
  return `${baseUrl}/wit/workitems/${id}?${query.join('&')}`;
}

// list_comments: sigue el continuationToken salvo que se pida una página con --top.
async function fetchComments(id) {
  const comments = [];
  let token = null;
  do {
    const query = [API_COMMENTS, `$top=${args.top ?? PAGE}`];
    if (token) query.push(`continuationToken=${encodeURIComponent(token)}`);
    const page = await getJson(
      `${baseUrl}/wit/workItems/${id}/comments?${query.join('&')}`
    );
    comments.push(...page.comments);
    token = args.top ? null : page.continuationToken;
  } while (token);
  return comments;
}

// list_revisions: pagina con $top y $skip hasta agotar las revisiones.
async function fetchRevisions(id) {
  const revisions = [];
  let skip = args.skip;
  for (;;) {
    const query = [API, `$top=${args.top ?? PAGE}`, `$skip=${skip}`];
    if (args.expand) query.push(`$expand=${args.expand}`);
    const { value } = await getJson(
      `${baseUrl}/wit/workItems/${id}/revisions?${query.join('&')}`
    );
    revisions.push(...value);
    if (args.top || value.length < PAGE) return revisions;
    skip += PAGE;
  }
}

async function downloadAttachments(item, dir) {
  const rels = (item.relations ?? []).filter(r => r.rel === 'AttachedFile');
  if (rels.length === 0) return;
  const attDir = join(dir, 'attachments');
  mkdirSync(attDir, { recursive: true });
  const saved = [];
  for (const rel of rels) {
    // El adjunto se descarga por su GUID (última parte de la URL). basename
    // evita que un nombre con rutas escriba fuera de attachments/.
    const guid = rel.url.split('/').pop();
    const name = basename(rel.attributes?.name ?? guid);
    const query = `fileName=${encodeURIComponent(name)}`;
    const response = await client.send(
      'GET',
      `${baseUrl}/wit/attachments/${guid}?${query}&download=true&${API}`,
      { accept: 'application/octet-stream' }
    );
    // Dos adjuntos con el mismo nombre no deben pisarse.
    let target = join(attDir, name);
    if (existsSync(target) && saved.includes(target)) {
      target = join(attDir, `${guid}-${name}`);
    }
    writeFileSync(target, Buffer.from(await response.arrayBuffer()));
    saved.push(target);
  }
  console.log(`  Adjuntos (${saved.length}):`);
  for (const file of saved) console.log(`    ${resolve(file)}`);
}

for (const id of args.ids) {
  const item = await getJson(itemUrl(id));
  const dir = join(args.out, String(item.id));
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'work-item.json'),
    `${JSON.stringify(item, null, 2)}\n`
  );

  if (args.comments) {
    const comments = await fetchComments(id);
    writeFileSync(
      join(dir, 'comments.json'),
      `${JSON.stringify(comments, null, 2)}\n`
    );
  }
  if (args.revisions) {
    const revisions = await fetchRevisions(id);
    writeFileSync(
      join(dir, 'revisions.json'),
      `${JSON.stringify(revisions, null, 2)}\n`
    );
  }

  const f = item.fields;
  console.log(
    `${f['System.WorkItemType'] ?? 'Work item'} ${item.id}${f['System.Title'] ? `: ${f['System.Title']}` : ''}`
  );
  console.log(`  Guardado en ${resolve(dir)}`);
  if (args.attachments && hasRelations) await downloadAttachments(item, dir);
}
