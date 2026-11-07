#!/usr/bin/env node
// Crea o actualiza work items de Azure DevOps (historia, bug, task, ...) con la
// API REST (wit/workitems, JSON Patch). Con id actualiza; sin id crea y exige
// --type y --title.
//
// Configuración: igual que scripts/ado/work-items/get.mjs (projectManagement de
// .sdd-devkit/settings.json y ADO_PAT del entorno o .env). El PAT necesita el
// permiso Work Items (Read & Write).
//
// Uso:
//   node scripts/ado/work-items/upsert.mjs [<id>] [opciones]
//   node scripts/ado/work-items/upsert.mjs --file <archivo.json> [opciones]
//   El id admite el formato 1234, #1234 o US-1234.
//
// Opciones:
//   --project <nombre>     Proyecto (por defecto, el de .sdd-devkit/settings.json)
//   --type <tipo>          Tipo al crear (User Story, Task, Bug, ...)
//   --title <texto>        System.Title
//   --description <texto>  System.Description
//   --state <estado>       System.State
//   --assigned-to <quien>  System.AssignedTo
//   --tags <a;b>           System.Tags
//   --area <ruta>          System.AreaPath
//   --iteration <ruta>     System.IterationPath
//   --parent <id>          Enlaza el work item como hijo de <id>
//   --field <Ref=valor>    Cualquier campo (repetible), p. ej. Microsoft.VSTS.Common.Priority=2
//   --comment <texto>      Agrega un comentario tras guardar
//   --file <archivo>       JSON con un objeto o una lista de objetos
//                          { id?, type?, title?, description?, state?, assignedTo?,
//                            tags?, area?, iteration?, parent?, comment?, fields?: {Ref: valor} }
//   --dry-run              Muestra las operaciones sin enviarlas
//
// Con --file, las opciones de línea de comandos se aplican a cada elemento
// como valores por defecto (--project y --dry-run aplican a todos).
import { readFileSync } from 'node:fs';
import { createClient } from '../lib/client.mjs';
import { fail, loadAdoSettings, loadDotEnv } from '../lib/config.mjs';

const API = 'api-version=7.1';
const API_COMMENTS = 'api-version=7.1-preview.4';
const PATCH = 'application/json-patch+json';
const USAGE =
  'Uso: upsert.mjs [<id>] [--type <t>] [--title <t>] [--description <t>] [--state <s>] [--assigned-to <a>] [--tags <a;b>] [--area <p>] [--iteration <p>] [--parent <id>] [--field <Ref=valor>] [--comment <t>] [--file <json>] [--project <p>] [--dry-run]';

// Opción de línea de comandos → campo de Azure DevOps.
const FIELD_OPTIONS = {
  '--title': ['title', 'System.Title'],
  '--description': ['description', 'System.Description'],
  '--state': ['state', 'System.State'],
  '--assigned-to': ['assignedTo', 'System.AssignedTo'],
  '--tags': ['tags', 'System.Tags'],
  '--area': ['area', 'System.AreaPath'],
  '--iteration': ['iteration', 'System.IterationPath'],
};

const parseId = raw => {
  const id = String(raw).replace(/^#|^[A-Za-z]+-/, '');
  if (!/^\d+$/.test(id)) fail(`ID de work item inválido: ${raw}\n${USAGE}`);
  return id;
};

function parseArgs(argv) {
  const args = {
    project: null,
    file: null,
    dryRun: false,
    item: { fields: {} },
  };
  const value = i => {
    if (argv[i + 1] === undefined)
      fail(`Falta el valor de ${argv[i]}.\n${USAGE}`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const opt = argv[i];
    if (opt === '--project') args.project = value(i++);
    else if (opt === '--file') args.file = value(i++);
    else if (opt === '--dry-run') args.dryRun = true;
    else if (opt === '--type') args.item.type = value(i++);
    else if (opt === '--parent') args.item.parent = parseId(value(i++));
    else if (opt === '--comment') args.item.comment = value(i++);
    else if (opt === '--field') {
      const pair = value(i++);
      const eq = pair.indexOf('=');
      if (eq < 1) fail(`--field requiere Ref=valor: ${pair}`);
      args.item.fields[pair.slice(0, eq)] = pair.slice(eq + 1);
    } else if (FIELD_OPTIONS[opt])
      args.item[FIELD_OPTIONS[opt][0]] = value(i++);
    else if (opt.startsWith('--')) fail(`Opción desconocida: ${opt}\n${USAGE}`);
    else if (args.item.id === undefined) args.item.id = parseId(opt);
    else
      fail(
        `Solo se admite un id por llamada (use --file para varios).\n${USAGE}`
      );
  }
  return args;
}

loadDotEnv();
const args = parseArgs(process.argv.slice(2));

let items;
if (args.file) {
  const data = JSON.parse(readFileSync(args.file, 'utf8'));
  const list = Array.isArray(data) ? data : [data];
  // Los valores de la línea de comandos son los de respaldo de cada elemento.
  items = list.map(entry => ({
    ...args.item,
    ...entry,
    id: entry.id === undefined ? args.item.id : parseId(entry.id),
    fields: { ...args.item.fields, ...entry.fields },
  }));
} else {
  items = [args.item];
}
if (items.length === 0) fail('No hay work items que procesar.');

// Convierte un elemento en operaciones JSON Patch.
function buildOps(item) {
  const create = item.id === undefined;
  if (create && (!item.type || !item.title)) {
    fail('Para crear un work item se requieren --type y --title.');
  }
  const fields = { ...item.fields };
  for (const [key, ref] of Object.values(FIELD_OPTIONS)) {
    if (item[key] !== undefined) fields[ref] = item[key];
  }
  const ops = Object.entries(fields).map(([ref, v]) => ({
    op: 'add', // "add" crea o reemplaza el campo
    path: `/fields/${ref}`,
    value: v,
  }));
  return { create, ops, fields };
}

const { orgUrl, project, baseUrl, workspace } = loadAdoSettings({
  project: args.project,
});

const plans = items.map(item => ({ item, ...buildOps(item) }));
if (args.dryRun) {
  for (const { item, create, ops } of plans) {
    const target = create ? `crear ${item.type}` : `actualizar ${item.id}`;
    console.log(`[dry-run] ${target}`);
    if (item.parent) console.log(`  parent: ${item.parent}`);
    console.log(JSON.stringify(ops, null, 2));
  }
  process.exit(0);
}

const client = createClient({
  baseUrl,
  workspace,
  permission: 'Work Items (Read & Write)',
});

let failures = 0;
for (const { item, create, ops } of plans) {
  try {
    const all = [...ops];
    if (item.parent) {
      all.push({
        op: 'add',
        path: '/relations/-',
        value: {
          rel: 'System.LinkTypes.Hierarchy-Reverse',
          url: `${orgUrl}/_apis/wit/workItems/${item.parent}`,
        },
      });
    }
    if (all.length === 0 && !item.comment) {
      console.log(`Sin cambios para ${item.id}.`);
      continue;
    }
    let id = item.id;
    let saved = null;
    if (all.length > 0) {
      const url = create
        ? `${baseUrl}/wit/workitems/$${encodeURIComponent(item.type)}?${API}`
        : `${baseUrl}/wit/workitems/${id}?${API}`;
      saved = await client.json(create ? 'POST' : 'PATCH', url, all, PATCH);
      id = saved.id;
    }
    if (item.comment) {
      await client.json(
        'POST',
        `${baseUrl}/wit/workItems/${id}/comments?${API_COMMENTS}`,
        { text: item.comment }
      );
    }
    const f = saved?.fields ?? {};
    console.log(
      `${create ? 'Creado' : 'Actualizado'} ${f['System.WorkItemType'] ?? item.type ?? 'work item'} ${id}${f['System.Title'] ? `: ${f['System.Title']}` : ''}`
    );
    console.log(
      `  ${orgUrl}/${encodeURIComponent(project)}/_workitems/edit/${id}`
    );
  } catch (error) {
    failures++;
    console.error(
      `Error en ${item.id ?? `nuevo ${item.type}`}: ${error.message}`
    );
  }
}
if (failures > 0) process.exit(1);
