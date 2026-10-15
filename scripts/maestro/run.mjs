#!/usr/bin/env node
// Ejecuta los flujos de Maestro generando JUnit y evidencias, y reintenta cuando
// el driver del dispositivo no llegó a arrancar: en ese caso todos los flujos
// fallan en milisegundos con `DeviceServerDiedException` sin haberse ejecutado.
//
// Uso: node scripts/maestro/run.mjs <flujos> <salida> [-- <args de maestro>]
// Variables: MAESTRO_DEVICE (serial del dispositivo), MAESTRO_RETRIES (1)
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const [flows, outDir, ...rest] = process.argv.slice(2);
if (!flows || !outDir) {
  console.error('Uso: run.mjs <flujos> <salida> [-- <args de maestro>]');
  process.exit(2);
}
const extra = rest[0] === '--' ? rest.slice(1) : rest;
const retries = Number(process.env.MAESTRO_RETRIES ?? 1);
const junit = join(outDir, 'junit.xml');

const args = [
  'test',
  ...(process.env.MAESTRO_DEVICE
    ? [`--udid=${process.env.MAESTRO_DEVICE}`]
    : []),
  flows,
  '--format',
  'junit',
  '--output',
  junit,
  '--debug-output',
  outDir,
  '--flatten-debug-output',
  ...extra,
];

// El driver no arrancó: ningún flujo llegó a ejecutarse y todos reportan la
// caída del servidor del dispositivo.
function driverNeverStarted() {
  if (!existsSync(junit)) return true;
  const xml = readFileSync(junit, 'utf8');
  const cases = (xml.match(/<testcase\b/g) ?? []).length;
  const dead = (xml.match(/DeviceServerDiedException/g) ?? []).length;
  return cases > 0 && dead >= cases;
}

let status = 1;
for (let attempt = 0; attempt <= retries; attempt += 1) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const result = spawnSync(process.env.MAESTRO_BIN ?? 'maestro', args, {
    stdio: 'inherit',
  });
  status = result.status ?? 1;
  if (status === 0 || !driverNeverStarted() || attempt === retries) break;
  console.error(
    `Maestro: el driver del dispositivo no arrancó; reintentando (${attempt + 1}/${retries})...`
  );
  spawnSync('sleep', ['5']);
}
process.exit(status);
