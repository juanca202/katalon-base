#!/usr/bin/env node
// Crea el .env a partir de .env.example y guarda el PAT de Azure DevOps en ADO_PAT.
//
// Uso: npm run ado:env:init
//   El script pide el PAT por consola. Mientras se escribe solo se muestran
//   asteriscos y los últimos 4 caracteres. El PAT no se recibe como argumento
//   (no queda en el historial del shell ni en la lista de procesos). Sin
//   terminal interactiva (pipe), lee el PAT de stdin.
//
// Si .env ya existe se conserva y solo se reemplaza la línea ADO_PAT; el resto
// de valores no se toca. El PAT nunca se imprime completo. .env está en .gitignore.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { emitKeypressEvents } from 'node:readline';
import { pathToFileURL } from 'node:url';

// Devuelve el contenido de `base` con ADO_PAT=<pat>: reemplaza la línea
// existente o la añade al final. Un `$` en el PAT se escribe tal cual.
export function setAdoPat(base, pat) {
  const line = `ADO_PAT=${pat}`;
  const pattern = /^ADO_PAT=.*$/m;
  if (pattern.test(base)) return base.replace(pattern, () => line);
  return `${base.replace(/\n*$/, '\n')}${line}\n`;
}

// Texto que se muestra mientras se escribe: asteriscos y los últimos 4
// caracteres. Con 4 o menos caracteres todo va oculto.
export function maskPat(value) {
  if (value.length <= 4) return '*'.repeat(value.length);
  return '*'.repeat(value.length - 4) + value.slice(-4);
}

function promptHidden(label) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    let value = '';
    const render = () => stdout.write(`\r\x1b[2K${label}${maskPat(value)}`);
    const finish = fn => {
      stdin.off('keypress', onKey);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      fn();
    };
    const onKey = (str, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        finish(() => reject(new Error('Cancelado.')));
      } else if (key.name === 'return' || key.name === 'enter') {
        finish(() => resolve(value.trim()));
      } else if (key.name === 'backspace') {
        value = value.slice(0, -1);
        render();
      } else if (str && !key.ctrl && !key.meta && str >= ' ') {
        value += str;
        render();
      }
    };
    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('keypress', onKey);
    render();
  });
}

async function readPat() {
  if (process.stdin.isTTY) return promptHidden('ADO_PAT: ');
  return readFileSync(0, 'utf8').trim();
}

async function main() {
  const target = '.env';
  const example = '.env.example';
  const existed = existsSync(target);
  if (!existed && !existsSync(example)) {
    console.error(`No existe ${example}.`);
    process.exit(2);
  }

  const pat = await readPat().catch(error => {
    console.error(error.message);
    process.exit(130);
  });
  if (!pat) {
    console.error('El PAT no puede estar vacío.');
    process.exit(2);
  }

  const base = readFileSync(existed ? target : example, 'utf8');
  writeFileSync(target, setAdoPat(base, pat), { mode: 0o600 });
  console.log(
    existed
      ? `${target} existente: ADO_PAT actualizado.`
      : `${target} creado desde ${example} con ADO_PAT.`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
