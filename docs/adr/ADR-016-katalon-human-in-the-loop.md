---
id: ADR-016
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, human-in-the-loop, katalon, otp, custom-keyword]
supersedes: ADR-010
superseded_by: null
emits: [testing/CR-018]
---

# ADR-016: Pruebas Human-in-the-Loop con Katalon

## Contexto

[ADR-010](ADR-010-human-in-the-loop-tests.md) definió los tipos de prueba Fully Automated y Human-in-the-Loop, e implementó la intervención humana con `askHuman()` sobre Playwright, la etiqueta `@human` y la configuración `playwright.human.config.ts`. Con Katalon como runner único ([ADR-013](ADR-013-katalon-test-runner.md)) esa implementación deja de existir, pero el problema sigue: flujos con OTP, CAPTCHA o aprobaciones en otro dispositivo que no se pueden automatizar de forma fiable y que no deben bloquear las ejecuciones desatendidas.

## Decisión

Se mantienen los dos tipos de prueba de ADR-010, Fully Automated (🤖) y Human-in-the-Loop (👤), y la obligación de que un Test Case Human-in-the-Loop indique en sus pasos qué input se ingresa manualmente. Cambia la implementación:

- **Custom Keyword `askHuman()`:** solicita el dato con un diálogo de entrada (`JOptionPane`), que detiene la ejecución hasta recibir la respuesta. Si está definida la variable de entorno alternativa, la usa sin mostrar el diálogo.
- **Etiqueta `human`:** todo caso de prueba que llame a `askHuman()` lleva la etiqueta `human` en sus propiedades. Si la persona debe interactuar con la página (por ejemplo, un CAPTCHA), lleva además la etiqueta `visible`.
- **Test Suite propia:** los casos `human` viven en una Test Suite dedicada, separada de las Test Suites desatendidas, para poder ejecutar estas sin que nadie esté pendiente del equipo.

Esta decisión supersede a [ADR-010](ADR-010-human-in-the-loop-tests.md).

## Consecuencias

### Positivas

- La intervención humana sigue siendo explícita, declarada en el Test Case y reutilizable.
- Las Test Suites desatendidas no se detienen esperando a una persona.
- El diálogo evita los problemas de lectura de terminal que tenía la versión sobre Playwright, y no requiere funciones de pago de Katalon.

### Negativas / trade-offs

- Las pruebas `human` necesitan a una persona frente al equipo, salvo que se defina la variable de entorno alternativa.
- Hay que mantener alineadas la Test Suite `human` y las desatendidas para que ningún caso quede en ambas o en ninguna.
- Hay que recordar la etiqueta `visible` en los casos que la requieren.

## Referencias

- [ADR-010: Tipos de prueba Fully Automated y Human-in-the-Loop](ADR-010-human-in-the-loop-tests.md) (superseded)
- [ADR-013: Katalon como runner único de pruebas](ADR-013-katalon-test-runner.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md)
- [Testing Standards](../standards/testing.md): requisito `test-types`
