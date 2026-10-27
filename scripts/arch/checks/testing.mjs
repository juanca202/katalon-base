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

// eslint-disable-next-line no-unused-vars -- sin chequeos activos hasta tener CR automatizados de Katalon
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

// Sin chequeos activos: los CR de Katalon (CR-005, CR-006, CR-010, CR-011)
// siguen en Pending.

process.exit(blockingFailures > 0 ? 1 : 0);
