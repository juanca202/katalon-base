---
name: Testing Standards
domain: testing
status: Active
last_update: 2026-10-05
source_adrs: [ADR-003, ADR-005, ADR-006, ADR-007, ADR-008, ADR-009, ADR-010]
tags: [testing, msw, azure-devops, allure, human-in-the-loop]
---

# Testing Standards

Este estándar cubre las pruebas automatizadas del framework de QA: estructura, Page Objects, esperas, datos, aserciones, reintentos, tiempos, mocks HTTP, APIs REST y GraphQL, evidencias de ejecución, trazabilidad con Test Cases de Azure DevOps, reportería con Allure, jerarquía Historia, Criterio y Caso de prueba, y tipos de prueba (Fully Automated y Human-in-the-Loop).

## Estructura de pruebas

**ID:** test-structure
**Estado:** Active

Las pruebas E2E **DEBEN** vivir en `tests/playwright/e2e/` con el nombre `*.e2e.spec.ts`. Las pruebas API **DEBEN** vivir en `tests/playwright/api/` con el nombre `*.api.spec.ts`.

Cada caso **DEBE** organizarse en `describe` / `it` con los pasos arrange, act y assert.

### Excepciones

Ninguna.

## Page Object Model

**ID:** page-object-model
**Estado:** Active

Las páginas **DEBEN** modelarse como clases `*Page.ts` que extienden `BasePage`. Los métodos **DEBEN** nombrarse con verbos (`login()`, `fillEmail()`, `clickSubmit()`). Los selectores **DEBEN** ser constantes en `UPPER_CASE`.

### Excepciones

Ninguna.

## Estrategias de espera

**ID:** wait-strategies
**Estado:** Active

Antes de una interacción **DEBE** usarse `waitForElement()`. Después de una navegación **DEBE** usarse `waitForLoadState('networkidle')`. Las operaciones lentas **DEBEN** tener un timeout explícito.

**NO DEBE** usarse `page.waitForTimeout()` con un valor fijo, un sleep hardcodeado ni un polling manual sin timeout.

### Excepciones

Ninguna.

## Aserciones

**ID:** assertions
**Estado:** Active

Las aserciones **DEBEN** comprobar un estado concreto: visibilidad de un locator, código HTTP o un formato esperado.

**NO DEBEN** usarse comprobaciones genéricas como `toBeTruthy()` o `toContain('success')` cuando existe una aserción específica.

### Excepciones

Ninguna.

## Reintentos

**ID:** retries
**Estado:** Active

Un elemento inestable **DEBE** reintentarse como máximo 3 veces. Las llamadas API **DEBEN** usar backoff exponencial. Los servicios externos **DEBEN** protegerse con un circuit breaker.

### Excepciones

Ninguna.

## Tiempos y paralelismo

**ID:** performance-timeouts
**Estado:** Active

El timeout de un elemento de UI **DEBE** ser de 10 segundos por defecto. Una llamada API **NO DEBE** superar 30 segundos. La carga de una página **NO DEBE** superar 60 segundos.

Las pruebas independientes **DEBEN** poder ejecutarse en paralelo, con usuarios o datos distintos.

### Excepciones

Ninguna.

## Mocks de APIs HTTP

**ID:** http-api-mocks
**Estado:** Active

MSW **PUEDE** usarse en el navegador o en herramientas de desarrollo local para simular APIs HTTP sin backend. Los handlers viven en `src/mocks/handlers.ts` y el worker del navegador en `src/mocks/browser.ts`. El service worker generado está en `public/mockServiceWorker.js`.

La suite E2E con Playwright **NO DEBE** exigir MSW. Esas pruebas se ejecutan contra flujos reales o con los mecanismos de red de Playwright.

### Excepciones

Este repositorio no contempla pruebas unitarias ni de integración. No aplica ninguna obligación de arrancar el server o el worker de MSW en una suite de test.

## Pruebas REST y GraphQL

**ID:** rest-graphql-api
**Estado:** Active

Las pruebas de APIs REST y GraphQL **DEBEN** usar `APIRequestContext` de Playwright. El contexto es la fixture `request` o, si la prueba ya dispone de una página, `page.request`.

GraphQL **DEBE** enviarse como petición HTTP de ese mismo contexto.

### Excepciones

Ninguna.

## Gestión de datos de prueba

**ID:** test-data
**Estado:** Active

Los datos de prueba estáticos, reproducibles y no sensibles **DEBEN** almacenarse en el repositorio. Cuando el dataset es declarativo, **DEBE** expresarse en JSON, YAML o CSV.

Los datos dinámicos y aislados **DEBEN** generarse con factories o builders. Las factories de código viven en `src/fixtures/`; `generateRandomUser()` genera usuarios únicos.

Los datos que dependen del ambiente y las credenciales **DEBEN** provenir de configuración externa y de secretos del entorno. Esos valores **NO DEBEN** versionarse en el repositorio.

Cada prueba **DEBE** crear los datos que necesita, de forma preferente mediante APIs o fixtures de preparación, y **NO DEBE** depender de datos dejados por otra prueba.

Los recursos creados durante una prueba **DEBEN** eliminarse al finalizar cuando sea técnicamente posible.

### Excepciones

Si el sistema bajo prueba no permite borrar un recurso, la prueba no usa ese recurso como precondición de otra.

## Evidencias de ejecución

**ID:** execution-evidence
**Estado:** Active

El framework **DEBE** generar automáticamente evidencias y artefactos de ejecución.

Toda ejecución automatizada **DEBE** producir evidencia, tanto si la prueba pasa como si falla. El tipo de evidencia principal se selecciona según el tipo de prueba: Playwright Trace en E2E funcional, screenshot en regresión visual, evidencia estructurada (request, response y assertions) en API, y video en escenarios que requieren evidencia audiovisual.

En las pruebas E2E funcionales, el trace **DEBE** ser la evidencia principal y la configuración base **DEBE** capturarlo en todas las ejecuciones (`trace: 'on'`). Los screenshots y los videos **NO DEBEN** capturarse por defecto; una prueba que requiera otro tipo de evidencia **PUEDE** sobrescribir la configuración a nivel de test, `test.describe` o proyecto.

La evidencia **DEBE** poder asociarse con el Test Case, la ejecución y el build, y **DEBE** conservarse según la política de retención de los artefactos del pipeline.

Los logs y los resultados de ejecución **DEBEN** estar disponibles para todas las ejecuciones.

En las pruebas API, la evidencia principal **DEBE** ser una representación estructurada de la ejecución que contenga el request (método, URL, headers relevantes y body), el response (status, headers relevantes y body), las assertions ejecutadas con su resultado, y el resultado y la duración de la prueba. Esta evidencia **DEBE** generarse tanto si la prueba pasa como si falla. El trace de Playwright **PUEDE** usarse como apoyo de diagnóstico, pero **NO DEBE** ser la evidencia principal de una prueba API.

### Excepciones

Ninguna.

## Trazabilidad con Test Cases de Azure DevOps

**ID:** azure-devops-traceability
**Estado:** Active

Toda prueba automatizada que represente un Test Case de Azure DevOps **DEBE** declarar su identificador al inicio del título con el formato `TC-<id>:` (por ejemplo `TC-1234: User can login successfully`). El identificador **DEBE** ser estable y corresponder al ID real del Test Case; el texto descriptivo **PUEDE** cambiar sin modificarlo.

Una prueba automatizada **NO DEBE** contener más de un identificador de Test Case. Un Test Case **PUEDE** tener una o varias pruebas automatizadas cuando existan distintos escenarios técnicos para validarlo.

Los resultados de ejecución **DEBEN** publicarse como parte del pipeline. La asociación entre cada resultado y su Test Case **DEBE** hacerse en el pipeline mediante las APIs de Azure DevOps, a partir del identificador declarado, **sin** depender de una asociación manual desde Test Plans, y **DEBE** poder reconstruirse a partir del código fuente y de los resultados del pipeline.

### Excepciones

Las pruebas que no representan un Test Case de Azure DevOps no declaran identificador.

## Reportería con Allure

**ID:** allure-reporting
**Estado:** Active

El framework **DEBE** generar un reporte de Allure en cada ejecución de pruebas mediante `allure run`, a partir de los resultados que escribe `allure-playwright`. El reporte **DEBE** conservar el historial de ejecuciones, configurado en `allurerc.mjs`, para habilitar tendencias y detección de pruebas inestables.

El pipeline **DEBERÍA** conservar el historial de Allure entre ejecuciones y **DEBE** publicar el reporte como artefacto.

El reporter `allure-playwright` **DEBE** tener `detail: true` para que el reporte muestre el paso a paso de cada prueba. Las acciones de negocio de los Page Objects y de las pruebas **DEBERÍAN** envolverse en `test.step()` con un nombre legible, de modo que cada Test Case se lea como una secuencia de pasos en Allure.

Allure **NO DEBE** reemplazar el reporte de Playwright como herramienta de análisis de traces: el trace sigue abriéndose con Playwright Trace Viewer.

### Excepciones

Las ejecuciones interactivas (`--ui`, `--headed`, `--debug`) **PUEDEN** ejecutarse sin generar el reporte de Allure.

## Jerarquía Historia, Criterio y Caso de prueba

**ID:** story-criterion-test-hierarchy
**Estado:** Active

Las pruebas **DEBERÍAN** agruparse con `acceptanceCriterion()` (`src/helpers/traceability.ts`), de modo que cada prueba quede bajo su criterio de aceptación y este bajo su historia de usuario. En Allure, la historia **DEBE** registrarse como `feature` y el criterio como `story`.

Los títulos de historia y de criterio **DEBEN** seguir el formato `US-<id>: título` y `AC-<id>: título`, igual que el `TC-<id>:` de cada prueba. El título de la prueba conserva el identificador de su Test Case según el requisito `azure-devops-traceability`.

### Excepciones

Las pruebas que no responden a un criterio de aceptación documentado no se agrupan.

## Tipos de prueba: Fully Automated y Human-in-the-Loop

**ID:** test-types
**Estado:** Active

Toda prueba y todo Test Case **DEBEN** clasificarse en uno de dos tipos:

| Tipo | Nombre            | Descripción                                                                      |
| ---- | ----------------- | -------------------------------------------------------------------------------- |
| 🤖   | Fully Automated   | El caso se ejecuta completamente sin intervención humana.                        |
| 👤   | Human-in-the-Loop | El flujo es automatizado, pero requiere intervención humana en uno o más puntos. |

Un Test Case Human-in-the-Loop **DEBE** especificar en sus pasos qué input se ingresa manualmente (por ejemplo, un OTP o un CAPTCHA), de modo que la prueba generada considere ese flujo.

La prueba que automatiza un Test Case Human-in-the-Loop **DEBE** solicitar el input con `askHuman()` (`src/helpers/human-intervention.ts`), **DEBE** llevar la etiqueta `@human` (y `@visible` si la persona debe interactuar con la página) y **NO DEBE** leer `stdin` ni `readline` directamente. `askHuman()` **DEBERÍA** admitir una variable de ambiente alternativa para ejecuciones sin persona y **DEBE** fallar en CI si no está definida.

La suite por defecto (`npm test`) **NO DEBE** ejecutar pruebas `@human`. Estas **DEBEN** ejecutarse con la configuración dedicada `playwright.human.config.ts` (`npm run test:human`): solo Chromium y un worker. El browser **DEBE** ser visible únicamente cuando la persona necesita interactuar con la página (por ejemplo, un CAPTCHA), lo cual se declara con la etiqueta `@visible` además de `@human`; cuando el dato llega por otro canal (email, SMS) el browser **DEBERÍA** ejecutarse headless.

### Excepciones

Ninguna.

## Criterios de cumplimiento

| ID     | Requisito                      | Descripción                                                                                                                                                               | Automatizable | Enfoque    | Verificación                                                |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------- | ----------------------------------------------------------- |
| CR-002 | http-api-mocks                 | MSW **PUEDE** usarse en el navegador o en desarrollo local para simular APIs sin backend                                                                                  | no            | —          | Pending                                                     |
| CR-003 | rest-graphql-api               | Las pruebas REST y GraphQL **DEBEN** usar `APIRequestContext` de Playwright                                                                                               | yes           | bloqueante | [checks/testing.mjs](../../scripts/arch/checks/testing.mjs) |
| CR-004 | test-data                      | Los datos dinámicos y aislados **DEBEN** generarse con factories o builders                                                                                               | no            | —          | Pending                                                     |
| CR-005 | test-data                      | Cada prueba **DEBE** crear los datos que necesita y **NO DEBE** depender de los que dejó otra prueba                                                                      | no            | —          | Pending                                                     |
| CR-006 | test-data                      | Los recursos creados durante una prueba **DEBEN** eliminarse al finalizar cuando sea técnicamente posible                                                                 | no            | —          | Pending                                                     |
| CR-007 | execution-evidence             | La configuración base de Playwright **DEBE** capturar el trace en todas las ejecuciones E2E, y los screenshots y videos **NO DEBEN** capturarse por defecto               | yes           | bloqueante | Pending                                                     |
| CR-008 | execution-evidence             | Los logs y los resultados de ejecución **DEBEN** estar disponibles para todas las ejecuciones                                                                             | yes           | bloqueante | Pending                                                     |
| CR-009 | azure-devops-traceability      | El título de toda prueba que represente un Test Case **DEBE** comenzar con `TC-<id>:`, donde `<id>` es numérico                                                           | yes           | bloqueante | [checks/testing.mjs](../../scripts/arch/checks/testing.mjs) |
| CR-010 | azure-devops-traceability      | El título de una prueba **NO DEBE** contener más de un identificador `TC-<id>`                                                                                            | yes           | bloqueante | [checks/testing.mjs](../../scripts/arch/checks/testing.mjs) |
| CR-011 | azure-devops-traceability      | Los resultados de Playwright **DEBEN** publicarse en un formato legible por máquina en cada ejecución del pipeline                                                        | yes           | bloqueante | [checks/testing.mjs](../../scripts/arch/checks/testing.mjs) |
| CR-012 | azure-devops-traceability      | La asociación resultado↔Test Case **DEBE** hacerse mediante las APIs de Azure DevOps y no de forma manual en Test Plans                                                   | no            | —          | Pending                                                     |
| CR-013 | azure-devops-traceability      | La asociación resultado↔Test Case **DEBE** poder reconstruirse a partir del código fuente y de los resultados del pipeline                                                | yes           | warning    | Pending                                                     |
| CR-014 | story-criterion-test-hierarchy | Las pruebas **DEBERÍAN** agruparse con `acceptanceCriterion()` y los títulos de historia y criterio **DEBEN** tener el formato `US-<id>:` y `AC-<id>:`                    | yes           | warning    | [checks/testing.mjs](../../scripts/arch/checks/testing.mjs) |
| CR-015 | test-types                     | Toda prueba que solicite input manual con `askHuman()` **DEBE** llevar la etiqueta `@human`                                                                               | yes           | bloqueante | Pending                                                     |
| CR-016 | test-types                     | La suite por defecto **NO DEBE** ejecutar pruebas `@human`, y estas **DEBEN** correr con una configuración dedicada (un worker, browser visible solo con `@visible`)      | yes           | bloqueante | Pending                                                     |
| CR-017 | test-types                     | El input manual **DEBE** solicitarse con `askHuman()` y **NO DEBE** leerse con `readline` o `stdin` directo en las pruebas                                                | yes           | bloqueante | Pending                                                     |
| CR-018 | test-types                     | Todo Test Case **DEBE** declarar su tipo (Fully Automated o Human-in-the-Loop) y, si es Human-in-the-Loop, **DEBE** indicar en sus pasos qué input se ingresa manualmente | no            | —          | Pending                                                     |

## Referencias

- [ADR-002: Page Object Model como Patrón de Diseño](../adr/ADR-002-page-object-model-pattern.md)
- [ADR-003: Mock Service Worker para mocks de APIs HTTP](../adr/ADR-003-msw-http-mocks.md)
- [ADR-005: APIRequestContext de Playwright para pruebas REST y GraphQL](../adr/ADR-005-playwright-api-request-context.md)
- [ADR-006: Estrategia de datos de prueba](../adr/ADR-006-test-data-strategy.md)
- [ADR-007: Evidencias y artefactos de ejecución](../adr/ADR-007-execution-evidence.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](../adr/ADR-008-azure-devops-test-case-traceability.md)
- [ADR-009: Allure como capa de reportería y jerarquía Historia → Criterio → Caso de prueba](../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md)
- [ADR-010: Tipos de prueba Fully Automated y Human-in-the-Loop](../adr/ADR-010-human-in-the-loop-tests.md)
