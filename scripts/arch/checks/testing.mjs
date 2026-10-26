#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Testing Standards — checks/testing.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR. La trazabilidad al criterio va en cada chequeo:
// CR-XXX en la línea de protocolo y un comentario junto al chequeo.
// =============================================================================
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

// Sin chequeos activos: los de Playwright y Maestro se retiraron al adoptar
// Katalon (ADR-013). Los CR de Katalon (CR-009, CR-010, CR-024, CR-025) siguen
// en Pending hasta que exista el proyecto en tests/katalon/.

process.exit(blockingFailures > 0 ? 1 : 0);
