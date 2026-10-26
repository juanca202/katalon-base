---
name: Testing Standards
domain: testing
status: Active
last_update: 2026-10-26
source_adrs:
  [
    ADR-001,
    ADR-003,
    ADR-005,
    ADR-006,
    ADR-007,
    ADR-008,
    ADR-009,
    ADR-010,
    ADR-011,
    ADR-012,
    ADR-013,
    ADR-014,
    ADR-015,
    ADR-016,
    ADR-017,
    ADR-018,
  ]
tags:
  [
    testing,
    runners,
    katalon,
    playwright,
    msw,
    azure-devops,
    allure,
    human-in-the-loop,
    maestro,
    mobile,
  ]
---

# Testing Standards

Este estándar cubre las pruebas automatizadas del framework de QA: runner de pruebas (Katalon), pruebas web desktop y web mobile, estructura, Page Objects, esperas, datos, aserciones, reintentos, tiempos, mocks HTTP, APIs REST y GraphQL, evidencias de ejecución, trazabilidad con Test Cases de Azure DevOps, reportería con Allure, jerarquía Historia, Criterio y Caso de prueba, tipos de prueba (Fully Automated y Human-in-the-Loop) y pruebas de apps móviles nativas o híbridas con Maestro.

## Runner de pruebas: Katalon

**ID:** katalon-runner
**Estado:** Active

Toda prueba automatizada (E2E web, APIs REST y GraphQL, y apps nativas o híbridas Android e iOS) **DEBE** implementarse con Katalon Studio, en su edición gratuita, y vivir en el proyecto de Katalon Studio del repositorio. Las pruebas se ejecutan localmente desde Katalon Studio. **NO DEBEN** usarse funciones que requieran Katalon Studio Enterprise ni Katalon Runtime Engine. **NO DEBEN** añadirse pruebas nuevas con Playwright ni con Maestro.

### Excepciones

Las pruebas existentes en `tests/playwright/` y `tests/maestro/` **PUEDEN** seguir ejecutándose mientras se migran a Katalon.

## Runners de pruebas

**ID:** test-runners
**Estado:** Superseded

> Superseded por el requisito `katalon-runner` ([ADR-013](../adr/ADR-013-katalon-test-runner.md) supersede a [ADR-001](../adr/ADR-001-test-runners.md)). Se conserva por trazabilidad; no se audita.

El framework dispone de los siguientes runners. Cada prueba automatizada **DEBE** ejecutarse con el runner que le corresponde según su tipo y **DEBE** vivir en la carpeta `tests/<runner>/` de ese runner:

| Runner     | Se usa para                                                                | Carpeta             |
| ---------- | -------------------------------------------------------------------------- | ------------------- |
| Playwright | E2E web (incluido el viewport móvil de un navegador) y APIs REST y GraphQL | `tests/playwright/` |
| Maestro    | Apps nativas o híbridas Android e iOS                                      | `tests/maestro/`    |

Ningún runner es exclusivo del framework. Un runner nuevo **DEBE** registrarse en [ADR-001](../adr/ADR-001-test-runners.md) y en esta tabla antes de añadir su carpeta de pruebas.

### Excepciones

Ninguna.

## Pruebas web desktop y web mobile

**ID:** web-testing
**Estado:** Superseded

> Superseded por el requisito `katalon-runner` ([ADR-013](../adr/ADR-013-katalon-test-runner.md) supersede a [ADR-012](../adr/ADR-012-playwright-web-desktop-and-mobile.md)). Se conserva por trazabilidad; no se audita.

Las pruebas web **DEBEN** ejecutarse con Playwright en dos modalidades, cada una como proyecto de `playwright.config.ts`: web desktop (`chromium`, perfil `Desktop Chrome`) y web mobile (`Mobile Chrome`, perfil de dispositivo móvil `Pixel 5`). Las pruebas E2E **DEBERÍAN** escribirse una sola vez y ejecutarse en ambos proyectos.

La web mobile es una emulación de viewport dentro del navegador: **NO DEBE** usarse para probar apps nativas o híbridas (requisito `mobile-app-testing`).

### Excepciones

Ninguna.

## Estructura de pruebas

**ID:** test-structure
**Estado:** Active

Las pruebas E2E **DEBEN** vivir en `tests/playwright/e2e/` con el nombre `*.e2e.spec.ts`. Las pruebas API **DEBEN** vivir en `tests/playwright/api/` con el nombre `*.api.spec.ts`.

Cada caso **DEBE** organizarse en `describe` / `it` con los pasos arrange, act y assert.

### Excepciones

Ninguna.

## Page Object Model

**ID:** page-object-model
**Estado:** Deprecated

> Deprecated: [ADR-002](../adr/ADR-002-page-object-model-pattern.md) dejó de estar vigente al adoptar Katalon ([ADR-013](../adr/ADR-013-katalon-test-runner.md)). Se conserva por trazabilidad; no se audita.

Las páginas **DEBEN** modelarse como clases `*Page.ts` que extienden `BasePage`. Los métodos **DEBEN** nombrarse con verbos (`login()`, `fillEmail()`, `clickSubmit()`). Los selectores **DEBEN** ser constantes en `UPPER_CASE`.

### Excepciones

Ninguna.

## Estrategias de espera

**ID:** wait-strategies
**Estado:** Active

Antes de interactuar con un elemento **DEBE** esperarse a su estado con un keyword de espera (`WebUI.waitForElementVisible()`, `WebUI.waitForElementClickable()` o su equivalente `Mobile`). Smart Wait **DEBERÍA** mantenerse activado en las pruebas web. Las operaciones lentas **DEBEN** tener un timeout explícito.

**NO DEBEN** usarse `WebUI.delay()` ni `Mobile.delay()` con un valor fijo para esperar a la aplicación, ni un polling manual sin timeout.

### Excepciones

Ninguna.

## Aserciones

**ID:** assertions
**Estado:** Active

Las verificaciones **DEBEN** comprobar un estado concreto con un keyword específico: visibilidad o texto de un Test Object (`WebUI.verifyElementVisible()`, `WebUI.verifyElementText()`), código HTTP (`WS.verifyResponseStatusCode()`) o un valor del response (`WS.verifyElementPropertyValue()`).

**NO DEBEN** usarse comprobaciones genéricas, como verificar que un texto contenga «success», cuando existe una verificación específica. Las aserciones **NO DEBEN** vivir dentro de los Custom Keywords: van en el caso de prueba.

### Excepciones

Ninguna.

## Reintentos

**ID:** retries
**Estado:** Active

La edición gratuita de Katalon no reintenta casos fallidos. Una acción sobre un elemento inestable **PUEDE** reintentarse dentro de un Custom Keyword, como máximo 3 veces. Las llamadas API **DEBEN** usar backoff exponencial. Los servicios externos **DEBEN** protegerse con un circuit breaker.

### Excepciones

Ninguna.

## Tiempos y paralelismo

**ID:** performance-timeouts
**Estado:** Active

El timeout por defecto de espera de elementos **DEBE** ser de 10 segundos (Project > Settings > Execution). Una llamada API **NO DEBE** superar 30 segundos. La carga de una página **NO DEBE** superar 60 segundos.

Los casos de prueba independientes **DEBEN** poder ejecutarse en paralelo (Test Suite Collection en modo paralelo), con usuarios o datos distintos. Una ejecución en paralelo no graba video ([ADR-014](../adr/ADR-014-katalon-execution-evidence.md)).

### Excepciones

Ninguna.

## Mocks de APIs HTTP

**ID:** http-api-mocks
**Estado:** Deprecated

> Deprecated: [ADR-003](../adr/ADR-003-msw-http-mocks.md) dejó de estar vigente al adoptar Katalon ([ADR-013](../adr/ADR-013-katalon-test-runner.md)). Se conserva por trazabilidad; no se audita.

MSW **PUEDE** usarse en el navegador o en herramientas de desarrollo local para simular APIs HTTP sin backend. Los handlers viven en `src/mocks/handlers.ts` y el worker del navegador en `src/mocks/browser.ts`. El service worker generado está en `public/mockServiceWorker.js`.

La suite E2E con Playwright **NO DEBE** exigir MSW. Esas pruebas se ejecutan contra flujos reales o con los mecanismos de red de Playwright.

### Excepciones

Este repositorio no contempla pruebas unitarias ni de integración. No aplica ninguna obligación de arrancar el server o el worker de MSW en una suite de test.

## Pruebas REST y GraphQL

**ID:** rest-graphql-api
**Estado:** Deprecated

> Deprecated: [ADR-005](../adr/ADR-005-playwright-api-request-context.md) dejó de estar vigente al adoptar Katalon ([ADR-013](../adr/ADR-013-katalon-test-runner.md)). Se conserva por trazabilidad; no se audita.

Las pruebas de APIs REST y GraphQL **DEBEN** usar `APIRequestContext` de Playwright. El contexto es la fixture `request` o, si la prueba ya dispone de una página, `page.request`.

GraphQL **DEBE** enviarse como petición HTTP de ese mismo contexto.

### Excepciones

Ninguna.

## Gestión de datos de prueba

**ID:** test-data
**Estado:** Active

> Adaptado a Katalon por [ADR-018](../adr/ADR-018-katalon-test-data.md), que supersede a [ADR-006](../adr/ADR-006-test-data-strategy.md).

Los datos que dependen del ambiente **DEBEN** definirse en un Execution Profile por ambiente (`Profiles/`) y leerse con `GlobalVariable`.

Las credenciales y los secretos **NO DEBEN** versionarse ni guardarse en Execution Profiles: **DEBEN** leerse de variables de entorno del equipo que ejecuta, mediante un Custom Keyword que falla de forma explícita si la variable no está definida.

Los datasets estáticos, reproducibles y no sensibles **DEBEN** almacenarse en el repositorio como CSV y usarse como Data Files de Katalon, recorridos desde el script con `findTestData()`.

Los datos dinámicos y aislados **DEBEN** generarse con factories o builders implementados como Custom Keywords.

Cada caso de prueba **DEBE** crear los datos que necesita, de forma preferente por API, y **NO DEBE** depender de datos dejados por otro caso.

Los recursos creados durante una prueba **DEBEN** eliminarse al finalizar cuando sea técnicamente posible.

### Excepciones

Si el sistema bajo prueba no permite borrar un recurso, la prueba no usa ese recurso como precondición de otra.

## Evidencias de ejecución

**ID:** execution-evidence
**Estado:** Active

> Adaptado a Katalon por [ADR-014](../adr/ADR-014-katalon-execution-evidence.md), que supersede a [ADR-007](../adr/ADR-007-execution-evidence.md).

Toda ejecución automatizada **DEBE** producir evidencia, tanto si la prueba pasa como si falla. El tipo de evidencia se selecciona según el tipo de prueba:

| Tipo de prueba               | Evidencia                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| E2E web (escritorio y móvil) | Log de ejecución paso a paso, captura automática al fallar y video de la ejecución       |
| App nativa o híbrida         | Log de ejecución paso a paso, captura automática al fallar y capturas de los pasos clave |
| API (REST y GraphQL)         | Request, response y verificaciones registrados explícitamente en el log                  |
| Regresión visual             | Captura de la comparación                                                                |

Las Test Suites de pruebas E2E web **DEBEN** grabar video de todas las ejecuciones, exitosas y fallidas, con el Screen Recorder de Katalon Studio. Las pruebas de apps móviles **DEBEN** tomar una captura en cada paso clave del flujo. El proyecto **DEBE** tener activada la captura automática al fallar.

En las pruebas API, la petición **DEBE** enviarse con el Custom Keyword común de evidencia, que registra en el log el request (método, URL, headers relevantes y body), el response (status, headers relevantes y body) y las verificaciones con su resultado, tanto si la prueba pasa como si falla.

La evidencia **DEBE** poder asociarse con el Test Case, la ejecución y el build, **DEBE** adjuntarse al reporte de Allure y al test run de Azure DevOps, y **DEBE** conservarse según la política de retención definida. Los logs y los resultados de ejecución **DEBEN** estar disponibles para todas las ejecuciones.

### Excepciones

Ninguna.

## Trazabilidad con Test Cases de Azure DevOps

**ID:** azure-devops-traceability
**Estado:** Active

> Adaptado a Katalon por [ADR-017](../adr/ADR-017-katalon-azure-devops-traceability.md), que supersede a [ADR-008](../adr/ADR-008-azure-devops-test-case-traceability.md).

Todo caso de prueba de Katalon que represente un Test Case de Azure DevOps **DEBE** comenzar su nombre con `TC-<id>: ` (por ejemplo `TC-1234: User can login successfully`). El ID **DEBE** corresponder al Test Case real; el texto descriptivo **PUEDE** cambiar sin modificarlo. Un caso **NO DEBE** nombrar más de un Test Case. Un Test Case **PUEDE** respaldarse con varios casos cuando existan distintos escenarios técnicos para validarlo.

Tras ejecutar una Test Suite, los resultados **DEBEN** publicarse en Azure DevOps con el script de publicación del repositorio, que crea un test run en el Test Plan del proyecto y registra el resultado de cada Test Case a partir de su `TC-<id>`, **sin** depender de una asociación manual desde Test Plans. La asociación **DEBE** poder reconstruirse a partir de los nombres de los casos y del `JUnit_Report.xml`. El Personal Access Token de Azure DevOps **NO DEBE** versionarse.

### Excepciones

Los casos de prueba que no representan un Test Case de Azure DevOps no declaran identificador.

## Reportería con Allure

**ID:** allure-reporting
**Estado:** Active

> Adaptado a Katalon por [ADR-015](../adr/ADR-015-katalon-allure-reporting.md), que supersede a [ADR-009](../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md).

Tras cada ejecución de una Test Suite, **DEBE** generarse un reporte de Allure a partir del `JUnit_Report.xml` que Katalon escribe en `Reports/`, convertido a `allure-results/` con las evidencias adjuntas. El reporte **DEBE** conservar el historial de ejecuciones, configurado en `allurerc.mjs`, para habilitar tendencias y detección de pruebas inestables, y **DEBE** adjuntarse al test run de Azure DevOps.

### Excepciones

Las ejecuciones de depuración de un caso suelto en Katalon Studio **PUEDEN** omitir el reporte de Allure.

## Jerarquía Historia, Criterio y Caso de prueba

**ID:** story-criterion-test-hierarchy
**Estado:** Active

> Adaptado a Katalon por [ADR-015](../adr/ADR-015-katalon-allure-reporting.md), que supersede a [ADR-009](../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md).

Los casos de prueba **DEBERÍAN** organizarse en `Test Cases/` del proyecto Katalon con una carpeta por historia de usuario y, dentro, una carpeta por criterio de aceptación: `Test Cases/US-<id>: título/AC-<id>: título/TC-<id>: título`. En Allure, la carpeta de la historia **DEBE** registrarse como `feature` y la del criterio como `story`.

Los nombres de historia y de criterio **DEBEN** seguir el formato `US-<id>: título` y `AC-<id>: título`, igual que el `TC-<id>:` de cada caso. El nombre del caso conserva el identificador de su Test Case según el requisito `azure-devops-traceability`.

### Excepciones

Los casos que no responden a un criterio de aceptación documentado no se agrupan.

## Tipos de prueba: Fully Automated y Human-in-the-Loop

**ID:** test-types
**Estado:** Active

> Adaptado a Katalon por [ADR-016](../adr/ADR-016-katalon-human-in-the-loop.md), que supersede a [ADR-010](../adr/ADR-010-human-in-the-loop-tests.md).

Toda prueba y todo Test Case **DEBEN** clasificarse en uno de dos tipos:

| Tipo | Nombre            | Descripción                                                                      |
| ---- | ----------------- | -------------------------------------------------------------------------------- |
| 🤖   | Fully Automated   | El caso se ejecuta completamente sin intervención humana.                        |
| 👤   | Human-in-the-Loop | El flujo es automatizado, pero requiere intervención humana en uno o más puntos. |

Un Test Case Human-in-the-Loop **DEBE** especificar en sus pasos qué input se ingresa manualmente (por ejemplo, un OTP o un CAPTCHA), de modo que la prueba generada considere ese flujo.

El caso de prueba de Katalon que automatiza un Test Case Human-in-the-Loop **DEBE** solicitar el input con el Custom Keyword `askHuman()` y **DEBE** llevar la etiqueta `human` (y `visible` si la persona debe interactuar con la página). `askHuman()` **DEBERÍA** admitir una variable de entorno alternativa para ejecuciones sin persona y **DEBE** fallar en CI si no está definida.

Los casos `human` **DEBEN** vivir en una Test Suite dedicada y **NO DEBEN** incluirse en las Test Suites desatendidas. El navegador **DEBE** ser visible únicamente en los casos con la etiqueta `visible`.

### Excepciones

Ninguna.

## Pruebas de apps móviles nativas o híbridas

**ID:** mobile-app-testing
**Estado:** Superseded

> Superseded por el requisito `katalon-runner` ([ADR-013](../adr/ADR-013-katalon-test-runner.md) supersede a [ADR-011](../adr/ADR-011-maestro-mobile-app-runner.md)). Se conserva por trazabilidad; no se audita.

Las pruebas de aplicaciones nativas o híbridas Android e iOS **DEBEN** ejecutarse con Maestro y **DEBEN** escribirse como flujos YAML en `tests/maestro/`. Playwright **NO DEBE** usarse para probar apps nativas o híbridas; su viewport móvil solo cubre la web.

Los resultados de Maestro **DEBEN** exportarse en formato JUnit y publicarse en cada ejecución del pipeline, de modo que la asociación con el Test Case siga el requisito `azure-devops-traceability`.

### Excepciones

Ninguna.

## Criterios de cumplimiento

| ID     | Requisito                      | Descripción                                                                                                                                                               | Automatizable | Enfoque    | Verificación                                   |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------- | ---------------------------------------------- |
| CR-002 | http-api-mocks                 | MSW **PUEDE** usarse en el navegador o en desarrollo local para simular APIs sin backend                                                                                  | no            | —          | Retirado: requisito deprecated                 |
| CR-003 | rest-graphql-api               | Las pruebas REST y GraphQL **DEBEN** usar `APIRequestContext` de Playwright                                                                                               | yes           | bloqueante | Retirado: requisito deprecated                 |
| CR-004 | test-data                      | Los datos dinámicos y aislados **DEBEN** generarse con factories o builders                                                                                               | no            | —          | Pending                                        |
| CR-005 | test-data                      | Cada prueba **DEBE** crear los datos que necesita y **NO DEBE** depender de los que dejó otra prueba                                                                      | no            | —          | Pending                                        |
| CR-006 | test-data                      | Los recursos creados durante una prueba **DEBEN** eliminarse al finalizar cuando sea técnicamente posible                                                                 | no            | —          | Pending                                        |
| CR-007 | execution-evidence             | La configuración base de Playwright **DEBE** capturar el trace en todas las ejecuciones E2E, y los screenshots y videos **NO DEBEN** capturarse por defecto               | yes           | bloqueante | Retirado: adaptado a Katalon (ADR-014/015/016) |
| CR-008 | execution-evidence             | Los logs y los resultados de ejecución **DEBEN** estar disponibles para todas las ejecuciones                                                                             | yes           | bloqueante | Pending                                        |
| CR-009 | azure-devops-traceability      | El nombre de todo caso de prueba que represente un Test Case **DEBE** comenzar con `TC-<id>:`, donde `<id>` es numérico                                                   | yes           | bloqueante | Pending                                        |
| CR-010 | azure-devops-traceability      | El nombre de un caso de prueba **NO DEBE** contener más de un identificador `TC-<id>`                                                                                     | yes           | bloqueante | Pending                                        |
| CR-011 | azure-devops-traceability      | Los resultados de Playwright **DEBEN** publicarse en un formato legible por máquina en cada ejecución del pipeline                                                        | yes           | bloqueante | Retirado: adaptado a Katalon (ADR-017)         |
| CR-012 | azure-devops-traceability      | La asociación resultado↔Test Case **DEBE** hacerse con el script de publicación del repositorio (API de Azure DevOps) y no de forma manual en Test Plans                  | no            | —          | Pending                                        |
| CR-013 | azure-devops-traceability      | La asociación resultado↔Test Case **DEBE** poder reconstruirse a partir de los nombres de los casos y del `JUnit_Report.xml`                                              | yes           | warning    | Pending                                        |
| CR-014 | story-criterion-test-hierarchy | Las pruebas **DEBERÍAN** agruparse con `acceptanceCriterion()` y los títulos de historia y criterio **DEBEN** tener el formato `US-<id>:` y `AC-<id>:`                    | yes           | warning    | Retirado: adaptado a Katalon (ADR-014/015/016) |
| CR-015 | test-types                     | Toda prueba que solicite input manual con `askHuman()` **DEBE** llevar la etiqueta `@human`                                                                               | yes           | bloqueante | Retirado: adaptado a Katalon (ADR-014/015/016) |
| CR-016 | test-types                     | La suite por defecto **NO DEBE** ejecutar pruebas `@human`, y estas **DEBEN** correr con una configuración dedicada (un worker, browser visible solo con `@visible`)      | yes           | bloqueante | Retirado: adaptado a Katalon (ADR-014/015/016) |
| CR-017 | test-types                     | El input manual **DEBE** solicitarse con `askHuman()` y **NO DEBE** leerse con `readline` o `stdin` directo en las pruebas                                                | yes           | bloqueante | Retirado: adaptado a Katalon (ADR-014/015/016) |
| CR-018 | test-types                     | Todo Test Case **DEBE** declarar su tipo (Fully Automated o Human-in-the-Loop) y, si es Human-in-the-Loop, **DEBE** indicar en sus pasos qué input se ingresa manualmente | no            | —          | Pending                                        |
| CR-019 | mobile-app-testing             | Las pruebas de apps nativas o híbridas Android e iOS **DEBEN** ejecutarse con Maestro y vivir como flujos YAML en `tests/maestro/`                                        | yes           | bloqueante | Retirado: requisito superseded por ADR-013     |
| CR-020 | mobile-app-testing             | Los resultados de Maestro **DEBEN** publicarse en formato JUnit en cada ejecución del pipeline                                                                            | yes           | bloqueante | Retirado: requisito superseded por ADR-013     |
| CR-021 | test-runners                   | Toda prueba automatizada **DEBE** vivir en `tests/<runner>/`, donde `<runner>` es un runner declarado (`playwright`, `maestro`)                                           | yes           | bloqueante | Retirado: requisito superseded por ADR-013     |
| CR-022 | test-runners                   | Un runner nuevo **DEBE** registrarse en ADR-001 y en el catálogo del estándar antes de añadir su carpeta de pruebas                                                       | no            | —          | Retirado: requisito superseded por ADR-013     |
| CR-023 | web-testing                    | `playwright.config.ts` **DEBE** declarar un proyecto de web desktop (perfil `Desktop`) y uno de web mobile (perfil de dispositivo móvil)                                  | yes           | bloqueante | Retirado: requisito superseded por ADR-013     |
| CR-024 | katalon-runner                 | Las pruebas automatizadas **DEBEN** vivir en un proyecto de Katalon Studio en `tests/katalon/`, con su archivo `.prj`                                                     | yes           | bloqueante | Pending                                        |
| CR-025 | execution-evidence             | Las Test Suites de pruebas E2E web **DEBEN** grabar video de todas las ejecuciones, exitosas y fallidas, y no solo de los casos fallidos                                  | yes           | bloqueante | Pending                                        |

## Referencias

- [ADR-001: Runners de pruebas: Playwright y Maestro](../adr/ADR-001-test-runners.md)
- [ADR-002: Page Object Model como Patrón de Diseño](../adr/ADR-002-page-object-model-pattern.md)
- [ADR-003: Mock Service Worker para mocks de APIs HTTP](../adr/ADR-003-msw-http-mocks.md)
- [ADR-005: APIRequestContext de Playwright para pruebas REST y GraphQL](../adr/ADR-005-playwright-api-request-context.md)
- [ADR-006: Estrategia de datos de prueba](../adr/ADR-006-test-data-strategy.md)
- [ADR-007: Evidencias y artefactos de ejecución](../adr/ADR-007-execution-evidence.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](../adr/ADR-008-azure-devops-test-case-traceability.md)
- [ADR-009: Allure como capa de reportería y jerarquía Historia → Criterio → Caso de prueba](../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md)
- [ADR-010: Tipos de prueba Fully Automated y Human-in-the-Loop](../adr/ADR-010-human-in-the-loop-tests.md)
- [ADR-011: Maestro como runner de pruebas de apps Android e iOS](../adr/ADR-011-maestro-mobile-app-runner.md)
- [ADR-012: Playwright para pruebas web desktop y web mobile](../adr/ADR-012-playwright-web-desktop-and-mobile.md)
- [ADR-013: Katalon como runner único de pruebas](../adr/ADR-013-katalon-test-runner.md)
- [ADR-014: Evidencias de ejecución con Katalon](../adr/ADR-014-katalon-execution-evidence.md)
- [ADR-015: Reportería con Allure a partir de los resultados de Katalon](../adr/ADR-015-katalon-allure-reporting.md)
- [ADR-016: Pruebas Human-in-the-Loop con Katalon](../adr/ADR-016-katalon-human-in-the-loop.md)
- [ADR-017: Trazabilidad con Test Cases de Azure DevOps desde los resultados de Katalon](../adr/ADR-017-katalon-azure-devops-traceability.md)
- [ADR-018: Datos de prueba con Katalon](../adr/ADR-018-katalon-test-data.md)
