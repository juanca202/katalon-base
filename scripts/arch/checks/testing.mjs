#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Testing Standards — checks/testing.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR. La trazabilidad al criterio va en cada chequeo:
// CR-XXX en la línea de protocolo y un comentario junto al chequeo.
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { colorStatus } from '../lib/colors.mjs';

const STANDARD = 'testing';
const require = createRequire(import.meta.url);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

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

const REQUIRED_CLIENTS = [
  'axios',
  'node-fetch',
  'got',
  'graphql-request',
  '@apollo/client',
];

function severity(rule) {
  if (rule === 'error' || rule === 2) return 'error';
  if (Array.isArray(rule) && (rule[0] === 'error' || rule[0] === 2))
    return 'error';
  return null;
}

function restrictedNames(rule) {
  const options = Array.isArray(rule) ? rule[1] : undefined;
  const paths = options?.paths;
  if (!Array.isArray(paths)) return [];
  return paths
    .map(entry => (typeof entry === 'string' ? entry : entry?.name))
    .filter(Boolean);
}

function coversApiTests(files) {
  const list = Array.isArray(files) ? files : [files];
  return list.some(
    pattern =>
      typeof pattern === 'string' && pattern.includes('tests/playwright/api')
  );
}

// --- CR-003 (bloqueante) -----------------------------------------------------
// Las pruebas REST y GraphQL DEBEN usar APIRequestContext de Playwright.
// Audita el cableado de ESLint: no-restricted-imports en error sobre tests/playwright/api,
// prohibiendo otros clientes HTTP o GraphQL. No ejecuta el linter.
check(
  'CR-003',
  'bloqueante',
  'regla de APIRequestContext obligatoria activa [regla ESLint: no-restricted-imports]',
  () => {
    const config = require(join(repoRoot, 'eslint.config.js'));
    const block = config.find(entry => coversApiTests(entry.files));
    if (!block) {
      throw new Error('No hay un bloque de ESLint para tests/playwright/api.');
    }
    const rule = block.rules?.['no-restricted-imports'];
    if (severity(rule) !== 'error') {
      throw new Error(
        'no-restricted-imports no está en severidad error para tests/playwright/api.'
      );
    }
    const names = new Set(restrictedNames(rule));
    const missing = REQUIRED_CLIENTS.filter(name => !names.has(name));
    if (missing.length > 0) {
      throw new Error(`Faltan clientes restringidos: ${missing.join(', ')}.`);
    }
  }
);

function ruleOptions(rule) {
  return Array.isArray(rule) ? (rule[1] ?? {}) : {};
}

function validTitleRule() {
  const config = require(join(repoRoot, 'eslint.config.js'));
  const block = config.find(
    entry =>
      entry.rules?.['playwright/valid-title'] &&
      [entry.files]
        .flat()
        .some(
          pattern => typeof pattern === 'string' && pattern.includes('tests/')
        )
  );
  if (!block) {
    throw new Error(
      'No hay un bloque de ESLint con playwright/valid-title para tests/.'
    );
  }
  const rule = block.rules['playwright/valid-title'];
  if (severity(rule) !== 'error') {
    throw new Error('playwright/valid-title no está en severidad error.');
  }
  return ruleOptions(rule);
}

// --- CR-009 (bloqueante) -----------------------------------------------------
// El título de toda prueba que represente un Test Case DEBE comenzar con
// TC-<id>:, donde <id> es numérico. Audita el cableado de ESLint
// (playwright/valid-title.mustMatch); no ejecuta el linter.
check(
  'CR-009',
  'bloqueante',
  'regla de prefijo TC-<id> obligatorio activa [regla ESLint: playwright/valid-title]',
  () => {
    const pattern = validTitleRule().mustMatch?.test;
    if (typeof pattern !== 'string') {
      throw new Error('mustMatch.test no está configurado.');
    }
    const re = new RegExp(pattern, 'u');
    if (
      !re.test('TC-1234: User can login') ||
      re.test('User can login') ||
      re.test('TC-abc: x')
    ) {
      throw new Error(
        `mustMatch.test (${pattern}) no exige el prefijo TC-<id>:.`
      );
    }
  }
);

// --- CR-010 (bloqueante) -----------------------------------------------------
// El título de una prueba NO DEBE contener más de un identificador TC-<id>.
// Audita el cableado de ESLint (playwright/valid-title.mustNotMatch).
check(
  'CR-010',
  'bloqueante',
  'regla de un solo TC-<id> por prueba activa [regla ESLint: playwright/valid-title]',
  () => {
    const pattern = validTitleRule().mustNotMatch?.test;
    if (typeof pattern !== 'string') {
      throw new Error('mustNotMatch.test no está configurado.');
    }
    const re = new RegExp(pattern, 'u');
    if (!re.test('TC-1: a TC-2') || re.test('TC-1: a')) {
      throw new Error(
        `mustNotMatch.test (${pattern}) no prohíbe más de un TC-<id>.`
      );
    }
  }
);

// --- CR-011 (bloqueante) -----------------------------------------------------
// Los resultados de Playwright DEBEN publicarse en un formato legible por
// máquina. Audita playwright.config.ts: reporter junit o json configurado.
check(
  'CR-011',
  'bloqueante',
  'reporter legible por máquina configurado (junit o json) en playwright.config.ts',
  () => {
    const source = readFileSync(join(repoRoot, 'playwright.config.ts'), 'utf8');
    if (!/\[\s*['"](junit|json)['"]/.test(source)) {
      throw new Error(
        "playwright.config.ts no declara un reporter 'junit' ni 'json'."
      );
    }
  }
);

function specFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return specFiles(path);
    return entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

// --- CR-014 (warning) --------------------------------------------------------
// Las pruebas DEBERÍAN agruparse con acceptanceCriterion() y los títulos de
// historia y criterio DEBEN tener el formato US-<id>: y AC-<id>:. Revisa de
// forma estática los specs de tests/playwright/e2e y tests/playwright/api.
check(
  'CR-014',
  'warning',
  'specs agrupados con acceptanceCriterion() y títulos US-<id>: / AC-<id>:',
  () => {
    const call = /acceptanceCriterion\(\s*(['"`])(.*?)\1\s*,\s*(['"`])(.*?)\3/s;
    const problems = [];
    for (const dir of ['tests/playwright/e2e', 'tests/playwright/api']) {
      for (const file of specFiles(join(repoRoot, dir))) {
        const name = file.slice(repoRoot.length + 1);
        const match = readFileSync(file, 'utf8').match(call);
        if (!match) {
          problems.push(`${name}: no usa acceptanceCriterion().`);
        } else if (!/^US-\d+: /.test(match[2])) {
          problems.push(`${name}: la historia no empieza con US-<id>: .`);
        } else if (!/^AC-\d+: /.test(match[4])) {
          problems.push(`${name}: el criterio no empieza con AC-<id>: .`);
        }
      }
    }
    if (problems.length > 0) throw new Error(problems.join('\n'));
  }
);

function mobileFlowFiles(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      [
        'node_modules',
        '.git',
        'dist',
        'test-results',
        'allure-results',
        'allure-report',
      ].includes(entry.name)
    )
      continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) mobileFlowFiles(path, found);
    else if (
      /\.ya?ml$/.test(entry.name) &&
      /^\s*appId\s*:/m.test(readFileSync(path, 'utf8'))
    )
      found.push(path);
  }
  return found;
}

const MAESTRO_DIR = join(repoRoot, 'tests', 'maestro');
const mobileFlows = mobileFlowFiles(repoRoot);

// --- CR-019 (bloqueante) -----------------------------------------------------
// Las pruebas de apps Android e iOS DEBEN ejecutarse con Maestro y vivir como
// flujos YAML en tests/maestro/. Un flujo Maestro (YAML con appId:) fuera de esa
// carpeta es una violación. Sin flujos, el criterio se cumple.
check(
  'CR-019',
  'bloqueante',
  'flujos Maestro (YAML con appId) solo dentro de tests/maestro/',
  () => {
    const outside = mobileFlows
      .filter(file => !file.startsWith(MAESTRO_DIR + sep))
      .map(file => file.slice(repoRoot.length + 1));
    if (outside.length > 0) {
      throw new Error(`Flujos fuera de tests/maestro/:\n${outside.join('\n')}`);
    }
  }
);

// --- CR-020 (bloqueante) -----------------------------------------------------
// Los resultados de Maestro DEBEN publicarse en formato JUnit en cada ejecución
// del pipeline. Si hay flujos, azure-pipelines.yml debe invocar maestro con
// formato junit. Sin flujos, el criterio se cumple.
check(
  'CR-020',
  'bloqueante',
  'pipeline publica resultados JUnit de Maestro (azure-pipelines.yml)',
  () => {
    if (mobileFlows.length === 0) return;
    const pipeline = readFileSync(
      join(repoRoot, 'azure-pipelines.yml'),
      'utf8'
    );
    if (!/maestro[^\n]*--format[ =]+junit/i.test(pipeline)) {
      throw new Error(
        "azure-pipelines.yml no ejecuta 'maestro test --format junit'."
      );
    }
  }
);

// --- CR-021 (bloqueante) -----------------------------------------------------
// Toda prueba automatizada DEBE vivir en tests/<runner>/, donde <runner> es un
// runner declarado. Un runner nuevo se añade a DECLARED_RUNNERS junto con su ADR.
const DECLARED_RUNNERS = ['playwright', 'maestro'];

check(
  'CR-021',
  'bloqueante',
  `tests/ contiene solo carpetas de runners declarados (${DECLARED_RUNNERS.join(', ')})`,
  () => {
    const undeclared = readdirSync(join(repoRoot, 'tests'), {
      withFileTypes: true,
    })
      .filter(
        entry => !entry.isDirectory() || !DECLARED_RUNNERS.includes(entry.name)
      )
      .map(entry => `tests/${entry.name}`);
    if (undeclared.length > 0) {
      throw new Error(
        `Fuera de un runner declarado:\n${undeclared.join('\n')}`
      );
    }
  }
);

// --- CR-023 (bloqueante) -----------------------------------------------------
// playwright.config.ts DEBE declarar un proyecto de web desktop (perfil Desktop)
// y uno de web mobile (perfil de dispositivo móvil). Audita el archivo de forma
// estática, ignorando comentarios; no ejecuta Playwright.
check(
  'CR-023',
  'bloqueante',
  'proyectos web desktop y web mobile declarados en playwright.config.ts',
  () => {
    const source = readFileSync(join(repoRoot, 'playwright.config.ts'), 'utf8')
      .replace(/^\s*\/\*[\s\S]*?\*\//gm, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const missing = [];
    if (!/devices\[\s*['"]Desktop [^'"]+['"]\s*\]/.test(source)) {
      missing.push('proyecto web desktop (devices["Desktop ..."])');
    }
    if (
      !/devices\[\s*['"](Pixel|Galaxy|iPhone|iPad)[^'"]*['"]\s*\]/.test(source)
    ) {
      missing.push('proyecto web mobile (devices["Pixel ..."] o similar)');
    }
    if (missing.length > 0) {
      throw new Error(`Faltan en playwright.config.ts:\n${missing.join('\n')}`);
    }
  }
);

process.exit(blockingFailures > 0 ? 1 : 0);
