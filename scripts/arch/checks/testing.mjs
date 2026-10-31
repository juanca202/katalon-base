#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Testing Standards — checks/testing.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR. La trazabilidad al criterio va en cada chequeo:
// CR-XXX en la línea de protocolo y un comentario junto al chequeo.
// =============================================================================
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { colorStatus } from '../lib/colors.mjs';

const STANDARD = 'testing';

let blockingFailures = 0;

function check(cr, enfoque, descripcion, fn) {
  try {
    fn();
    console.log(`${colorStatus('PASS')} ${STANDARD}/${cr} — ${descripcion}`);
  } catch (err) {
    const status = enfoque === 'warning' ? 'WARN' : 'FAIL';
    if (status === 'FAIL') blockingFailures += 1;
    console.log(`${colorStatus(status)} ${STANDARD}/${cr} — ${descripcion}`);
    const detail = err?.message || '';
    if (detail) {
      console.log(
        detail
          .trim()
          .split('\n')
          .map(line => `     ${line}`)
          .join('\n')
      );
    }
  }
}

const SCRIPTS_DIR = 'tests/katalon/Scripts';
const BLOCKS = ['Preparaci', 'Acci', 'Verificaci'];
const BLOCK_LINE = /^\s*\/\/\s*[=-]*\s*(Preparaci|Acci|Verificaci)/i;
const STEP_LINE = /^\s*'[^'\n]+'\s*$/;

function groovyScripts(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return groovyScripts(path);
    return name.endsWith('.groovy') ? [path] : [];
  });
}

// Divide un script en sus bloques (Preparación, Acción, Verificación).
function blocksOf(source) {
  const blocks = new Map();
  let current = null;
  for (const line of source.split('\n')) {
    const match = line.match(BLOCK_LINE);
    if (match) {
      current = match[1].toLowerCase();
      blocks.set(current, []);
    } else if (current) {
      blocks.get(current).push(line);
    }
  }
  return blocks;
}

const scripts = groovyScripts(SCRIPTS_DIR).map(path => ({
  name: relative(SCRIPTS_DIR, path),
  blocks: blocksOf(readFileSync(path, 'utf8')),
}));

// CR-012 (test-structure): bloques Preparación, Acción y Verificación.
check(
  'CR-012',
  'warning',
  'Los scripts tienen los bloques Preparación, Acción y Verificación',
  () => {
    const bad = scripts.filter(s =>
      BLOCKS.some(b => !s.blocks.has(b.toLowerCase()))
    );
    if (bad.length) {
      throw new Error(bad.map(s => `- ${s.name}`).join('\n'));
    }
  }
);

// CR-013 (test-structure): descripciones de paso en cada bloque, para que
// Allure muestre pasos legibles (scripts/katalon/lib/report.mjs).
check(
  'CR-013',
  'warning',
  "Cada bloque de los scripts tiene sentencias de descripción de paso ('Paso N: …')",
  () => {
    const bad = scripts.filter(s =>
      BLOCKS.some(b => {
        const lines = s.blocks.get(b.toLowerCase());
        return lines && !lines.some(l => STEP_LINE.test(l));
      })
    );
    if (bad.length) {
      throw new Error(bad.map(s => `- ${s.name}`).join('\n'));
    }
  }
);

process.exit(blockingFailures > 0 ? 1 : 0);
