import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { colorStatus, stripAnsi } from './colors.mjs';

describe('stripAnsi', () => {
  it('quita los códigos de color y deja el texto del protocolo', () => {
    assert.equal(stripAnsi('\u001b[32mPASS\u001b[0m'), 'PASS');
    assert.equal(
      stripAnsi('\u001b[31mFAIL\u001b[0m testing/CR-001 — detalle'),
      'FAIL testing/CR-001 — detalle'
    );
  });

  it('deja igual una línea que ya viene sin color', () => {
    const line = 'WARN testing/CR-008 — asociación reconstruible';
    assert.equal(stripAnsi(line), line);
  });
});

describe('colorStatus', () => {
  it('devuelve tal cual un estado que no tiene color asignado', () => {
    assert.equal(colorStatus('OTRO'), 'OTRO');
    assert.equal(colorStatus(''), '');
  });

  it('el estado coloreado sigue leyéndose como PASS, WARN o FAIL', () => {
    for (const status of ['PASS', 'WARN', 'FAIL']) {
      assert.equal(stripAnsi(colorStatus(status)), status);
    }
  });
});
