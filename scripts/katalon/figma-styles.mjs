#!/usr/bin/env node
// Genera los valores de referencia de las pruebas de estilos contra Figma
// a partir de una exportación .fig del diseño. La prueba
// de Katalon no consulta Figma en ejecución: compara contra el CSV versionado
// que este script rellena (ADR-007).
//
// El CSV define qué se mide (caso, pantalla, nodo, Test Object, propiedad CSS y
// tolerancia); el script solo calcula la columna `expected` leyendo del .fig el
// nodo indicado en `figmaNode`:
//   1:486            nodo del documento
//   1:517>1:283      hijo 1:283 del componente que usa la instancia 1:517, con
//                    los overrides de esa instancia aplicados
//   1:517>1:283#2    línea 2 de un texto con varios estilos
//
// Uso: node scripts/katalon/figma-styles.mjs [--check] <archivo.fig> <valores.csv>
//   --check  no escribe: lista los valores que cambiarían y sale con código 1.
//      node scripts/katalon/figma-styles.mjs --tree <nodo> <archivo.fig>
//   --tree   lista el árbol de un nodo (id, tipo y nombre; en las instancias,
//            los hijos de su componente), para elegir el `figmaNode` de una fila.

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import zlib from 'node:zlib';

const require = createRequire(import.meta.url);
const kiwi = require('kiwi-schema');

const USAGE =
  'Uso: node scripts/katalon/figma-styles.mjs [--check] <archivo.fig> <valores.csv>\n' +
  '     node scripts/katalon/figma-styles.mjs --tree <nodo> <archivo.fig>';
const args = process.argv.slice(2);
const check = args.includes('--check');
const treeIndex = args.indexOf('--tree');
const treeRoot = treeIndex >= 0 ? args[treeIndex + 1] : undefined;
const [figFile, csvFile] = args.filter(
  (arg, index) =>
    arg !== '--check' &&
    (treeIndex < 0 || (index !== treeIndex && index !== treeIndex + 1))
);
if (!figFile || (!csvFile && !treeRoot)) {
  console.error(USAGE);
  process.exit(2);
}

// Un .fig es un ZIP; basta con leer una entrada por su nombre.
function zipEntry(buffer, name) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let offset = buffer.readUInt32LE(end + 16);
  for (let i = buffer.readUInt16LE(end + 10); i > 0; i--) {
    const method = buffer.readUInt16LE(offset + 10);
    const size = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const local = buffer.readUInt32LE(offset + 42);
    const entry = buffer.toString(
      'utf8',
      offset + 46,
      offset + 46 + nameLength
    );
    if (entry === name) {
      const start =
        local +
        30 +
        buffer.readUInt16LE(local + 26) +
        buffer.readUInt16LE(local + 28);
      const data = buffer.subarray(start, start + size);
      return method === 8 ? zlib.inflateRawSync(data) : data;
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${figFile} no contiene ${name}`);
}

// canvas.fig: cabecera «fig-kiwi», versión y dos bloques con su longitud: el
// esquema kiwi (deflate) y el documento (zstd o deflate).
function readNodes(file) {
  const canvas = zipEntry(readFileSync(file), 'canvas.fig');
  if (canvas.toString('latin1', 0, 8) !== 'fig-kiwi') {
    throw new Error(`${file} no es una exportación de Figma (fig-kiwi)`);
  }
  const chunks = [];
  for (let offset = 12; offset < canvas.length;) {
    const length = canvas.readUInt32LE(offset);
    chunks.push(canvas.subarray(offset + 4, offset + 4 + length));
    offset += 4 + length;
  }
  const unpack = chunk =>
    chunk.readUInt32LE(0) === 0xfd2fb528
      ? zlib.zstdDecompressSync(chunk)
      : zlib.inflateRawSync(chunk);
  const schema = kiwi.compileSchema(kiwi.decodeBinarySchema(unpack(chunks[0])));
  return schema.decodeMessage(unpack(chunks[1])).nodeChanges;
}

const guid = value => value && `${value.sessionID}:${value.localID}`;
const nodeList = readNodes(figFile);
const nodes = new Map(nodeList.map(node => [guid(node.guid), node]));

// Valor de cada variable de color (ft-text-color, ft-text-muted-color…) por su
// clave. Un relleno ligado a una variable se pinta con el valor de la
// variable: el color guardado en el relleno puede estar desactualizado.
const colorVariables = new Map(
  nodeList
    .filter(node => node.type === 'VARIABLE')
    .map(node => [
      node.key,
      node.variableDataValues?.entries?.[0]?.variableData?.value?.colorValue,
    ])
    .filter(([, color]) => color)
);

// Nodo con los overrides de la instancia aplicados.
function resolve(ref) {
  const [path, line] = ref.split('#');
  const [instanceId, childId] = path.split('>');
  const instance = nodes.get(instanceId);
  if (!instance) throw new Error(`nodo ${instanceId} inexistente`);
  if (!childId) return { node: instance, line: Number(line) || 0 };
  const child = nodes.get(childId);
  const symbolId = guid(instance.symbolData?.symbolID);
  if (!child || !symbolId)
    throw new Error(
      `${ref}: ${instanceId} no es una instancia o ${childId} no existe`
    );
  const key = guid(child.overrideKey);
  const overrides = (instance.symbolData.symbolOverrides ?? []).filter(
    override =>
      override.guidPath.guids.length === 1 &&
      guid(override.guidPath.guids[0]) === key
  );
  const node = Object.assign(
    {},
    child,
    ...overrides.map(override =>
      Object.fromEntries(
        Object.entries(override).filter(([field]) => field !== 'guidPath')
      )
    )
  );
  return { node, line: Number(line) || 0 };
}

// Estilo de texto de una línea: el estilo base del nodo con el override de la
// primera letra de esa línea (textData.styleOverrideTable).
function textStyle(node, line) {
  const text = node.textData ?? {};
  if (!line || !text.characters) return node;
  const start = text.characters
    .split('\n')
    .slice(0, line - 1)
    .reduce((sum, part) => sum + part.length + 1, 0);
  const styleId = text.characterStyleIDs?.[start] ?? 0;
  const override = (text.styleOverrideTable ?? []).find(
    style => style.styleID === styleId
  );
  return override ? { ...node, ...override } : node;
}

const WEIGHTS = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

const hex = value =>
  Math.round(value * 255)
    .toString(16)
    .padStart(2, '0');

// Primer relleno sólido visible, como #rrggbb o #rrggbbaa si no es opaco. Si
// el relleno está ligado a una variable, manda el valor de la variable con su
// alfa (es lo que entrega el MCP de Figma); la opacidad del relleno solo se
// aplica a los colores sueltos.
function solid(paints) {
  const paint = (paints ?? []).find(
    item => item.type === 'SOLID' && item.visible !== false
  );
  if (!paint) return '#00000000';
  const variable = colorVariables.get(
    paint.colorVar?.value?.alias?.assetRef?.key
  );
  const { r, g, b, a = 1 } = variable ?? paint.color;
  const alpha = variable ? a : a * (paint.opacity ?? 1);
  return `#${hex(r)}${hex(g)}${hex(b)}${alpha < 1 ? hex(alpha) : ''}`;
}

const px = value => `${Math.round(value ?? 0)}px`;

const PROPERTIES = {
  'font-family': style => style.fontName.family,
  'font-size': style => px(style.fontSize),
  'font-weight': style =>
    String(
      WEIGHTS[style.fontName.style.toLowerCase().replace(/[\s-]/g, '')] ?? 400
    ),
  color: style => solid(style.fillPaints),
  'background-color': node => solid(node.fillPaints),
  'border-top-color': node => solid(node.strokePaints),
  'border-top-width': node =>
    solid(node.strokePaints) === '#00000000' ? '0px' : px(node.strokeWeight),
  'padding-left': node => px(node.stackHorizontalPadding),
  'padding-right': node =>
    px(node.stackPaddingRight ?? node.stackHorizontalPadding),
  'padding-top': node => px(node.stackVerticalPadding),
  'padding-bottom': node =>
    px(node.stackPaddingBottom ?? node.stackVerticalPadding),
  'column-gap': node => px(node.stackSpacing),
  width: node => px(node.size?.x),
  height: node => px(node.size?.y),
};

if (treeRoot) {
  const children = new Map();
  for (const node of nodeList) {
    const parent = guid(node.parentIndex?.guid);
    if (parent) children.set(parent, [...(children.get(parent) ?? []), node]);
  }
  const print = (id, depth, prefix) => {
    const node = nodes.get(id);
    if (!node) throw new Error(`nodo ${id} inexistente`);
    const symbol = guid(node.symbolData?.symbolID);
    console.log(
      `${'  '.repeat(depth)}${prefix}${id} ${node.type} «${node.name}»${symbol ? ` → componente ${symbol}` : ''}`
    );
    const kids = (children.get(id) ?? []).sort((a, b) =>
      a.parentIndex.position < b.parentIndex.position ? -1 : 1
    );
    for (const kid of kids) print(guid(kid.guid), depth + 1, prefix);
    // Los hijos de una instancia se referencian como <instancia>><hijo>; solo
    // se expanden las instancias del frame, no las anidadas en un componente.
    if (symbol && !prefix) print(symbol, depth + 1, `${id}>`);
  };
  print(treeRoot, 0, '');
  process.exit(0);
}

// CSV sin comillas: ningún campo del archivo lleva comas.
const [header, ...rows] = readFileSync(csvFile, 'utf8').trimEnd().split('\n');
const columns = header.split(',');
const at = name => columns.indexOf(name);
const changes = [];
const output = rows.map((row, index) => {
  const cells = row.split(',');
  const ref = cells[at('figmaNode')];
  const property = cells[at('property')];
  const read = PROPERTIES[property];
  if (!read)
    throw new Error(`fila ${index + 2}: propiedad no soportada «${property}»`);
  const { node, line } = resolve(ref);
  const value = read(node.type === 'TEXT' ? textStyle(node, line) : node);
  if (cells[at('expected')] !== value) {
    changes.push(
      `fila ${index + 2} ${ref} ${cells[at('element')]} · ${property}: ${cells[at('expected')]} → ${value}`
    );
    cells[at('expected')] = value;
  }
  return cells.join(',');
});

console.log(
  changes.length
    ? changes.join('\n')
    : 'Sin cambios: el CSV coincide con el .fig.'
);
if (check) process.exit(changes.length ? 1 : 0);
writeFileSync(csvFile, `${[header, ...output].join('\n')}\n`);
console.log(
  `${rows.length} filas, ${changes.length} valores actualizados en ${csvFile}`
);
