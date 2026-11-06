import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeFailure, parseJUnit } from './report.mjs';

describe('describeFailure', () => {
  it('no inventa un mensaje cuando el fallo viene vacío', () => {
    assert.deepEqual(describeFailure(''), { message: '', trace: '' });
    assert.deepEqual(describeFailure(null), { message: '', trace: '' });
  });

  it('traduce el código HTTP distinto al esperado', () => {
    const raw = "Expected status code is '200' but found '500'";
    assert.deepEqual(describeFailure(raw), {
      message: 'La API respondió 500 y se esperaba 200.',
      trace: raw,
    });
  });

  it('explica la navegación cuando falta la URL base del perfil', () => {
    const raw = "Unable to navigate to 'null/login'";
    assert.equal(
      describeFailure(raw).message,
      'No se pudo abrir «null/login»: falta la URL base en el Execution Profile.'
    );
  });

  it('se queda con la primera línea y descarta la causa repetida', () => {
    const raw =
      'El elemento no apareció (Root cause: TimeoutException)\n\tat Script.groovy:12';
    const failure = describeFailure(raw);
    assert.equal(failure.message, 'El elemento no apareció');
    assert.equal(failure.trace, raw);
  });
});

describe('parseJUnit', () => {
  const xml = `<?xml version="1.0"?>
<testsuites>
  <testsuite name="TS - acceso" timestamp="2026-11-06T12:00:00">
    <testcase name="Test Cases/US-1/TC-42 - inicia sesión" status="PASSED" time="1.5"/>
    <testcase name="Test Cases/US-1/TC-7 - consulta saldo" status="FAILED" time="0.25">
      <failure message="Expected status code is '401' but found '500'">traza del fallo</failure>
    </testcase>
    <testcase name="Test Cases/US-1/sin identificador" time="0">
      <skipped/>
    </testcase>
    <testcase name="Test Cases/US-1/TC-9 - caída" status="ERROR" time="0.1">
      <error message="boom"><![CDATA[java.lang.RuntimeException]]></error>
    </testcase>
  </testsuite>
</testsuites>`;

  it('lee el identificador, el estado y la duración de cada caso', () => {
    const cases = parseJUnit(xml);
    const start = Date.parse('2026-11-06T12:00:00');

    assert.equal(cases.length, 4);

    assert.deepEqual(
      {
        shortName: cases[0].shortName,
        tcId: cases[0].tcId,
        suite: cases[0].suite,
        status: cases[0].status,
        durationMs: cases[0].durationMs,
        start: cases[0].start,
        stop: cases[0].stop,
      },
      {
        shortName: 'TC-42 - inicia sesión',
        tcId: '42',
        suite: 'TS - acceso',
        status: 'passed',
        durationMs: 1500,
        start,
        stop: start + 1500,
      }
    );

    assert.equal(cases[1].tcId, '7');
    assert.equal(cases[1].status, 'failed');
    assert.equal(
      cases[1].message,
      "Expected status code is '401' but found '500'"
    );
    assert.equal(cases[1].trace, 'traza del fallo');
    assert.equal(cases[1].start, start + 1500);
    assert.equal(cases[1].durationMs, 250);

    assert.equal(cases[2].tcId, null);
    assert.equal(cases[2].status, 'skipped');
    assert.equal(cases[2].durationMs, 0);

    assert.equal(cases[3].tcId, '9');
    assert.equal(cases[3].status, 'broken');
    assert.equal(cases[3].trace, 'java.lang.RuntimeException');
    assert.equal(cases[3].start, start + 1750);
    assert.equal(cases[3].durationMs, 100);
  });

  it('devuelve una lista vacía si el XML no trae suites', () => {
    assert.deepEqual(parseJUnit('<testsuites></testsuites>'), []);
  });
});
