#!/usr/bin/env node
// Crea el .env a partir de .env.example y guarda el PAT de Azure DevOps en ADO_PAT.
//
// Uso:
//   node scripts/ado/env/init.mjs <pat>            PAT como argumento
//   echo "<pat>" | node scripts/ado/env/init.mjs   PAT por stdin (no queda en el historial del shell)
//
// Si .env ya existe se conserva y solo se reemplaza la línea ADO_PAT; el resto
// de valores no se toca. El PAT nunca se imprime. .env está en .gitignore.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Devuelve el contenido de `base` con ADO_PAT=<pat>: reemplaza la línea
// existente o la añade al final. Un `$` en el PAT se escribe tal cual.
export function setAdoPat(base, pat) {
  const line = `ADO_PAT=${pat}`;
  const pattern = /^ADO_PAT=.*$/m;
  if (pattern.test(base)) return base.replace(pattern, () => line);
  return `${base.replace(/\n*$/, '\n')}${line}\n`;
}

function readStdin() {
  return readFileSync(0, 'utf8');
}

function main() {
  const arg = process.argv[2];
  const pat = (arg ?? (process.stdin.isTTY ? '' : readStdin())).trim();
  if (!pat || pat.startsWith('-')) {
    console.error(
      'Uso: node scripts/ado/env/init.mjs <pat>  (o el PAT por stdin)'
    );
    process.exit(2);
  }

  const target = '.env';
  const example = '.env.example';
  const existed = existsSync(target);
  if (!existed && !existsSync(example)) {
    console.error(`No existe ${example}.`);
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
