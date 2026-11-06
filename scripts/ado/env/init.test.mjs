import test from 'node:test';
import assert from 'node:assert/strict';
import { maskPat, setAdoPat } from './init.mjs';

test('reemplaza la línea ADO_PAT existente', () => {
  const out = setAdoPat('A=1\nADO_PAT=${ADO_PAT_BAYTEQ}\nB=2\n', 'abc');
  assert.equal(out, 'A=1\nADO_PAT=abc\nB=2\n');
});

test('añade ADO_PAT si no existe', () => {
  assert.equal(setAdoPat('A=1', 'abc'), 'A=1\nADO_PAT=abc\n');
});

test('no interpreta $ del PAT como patrón de reemplazo', () => {
  assert.equal(setAdoPat('ADO_PAT=x\n', "a$&b$'c"), "ADO_PAT=a$&b$'c\n");
});

test('maskPat oculta todo salvo los últimos 4 caracteres', () => {
  assert.equal(maskPat(''), '');
  assert.equal(maskPat('abcd'), '****');
  assert.equal(maskPat('abcde'), '*bcde');
  assert.equal(maskPat('abcdefghij'), '******ghij');
});
