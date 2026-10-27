---
name: Testing Standards
domain: testing
status: Active
last_update: 2026-10-26
source_adrs: [ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007]
tags: [testing, katalon, allure, azure-devops, human-in-the-loop, test-data]
---

# Testing Standards

Este estándar cubre las pruebas automatizadas del framework de QA con Katalon Studio: runner, estructura de pruebas, esperas, aserciones, reintentos, tiempos, datos de prueba, evidencias de ejecución, trazabilidad con Test Cases de Azure DevOps, reportería con Allure, jerarquía Historia, Criterio y Caso de prueba, y tipos de prueba (Fully Automated y Human-in-the-Loop).

## Runner de pruebas: Katalon

**ID:** katalon-runner
**Estado:** Active

Toda prueba automatizada (E2E web, APIs REST y GraphQL, y apps nativas o híbridas Android e iOS) **DEBE** implementarse con Katalon Studio, en su edición gratuita, y vivir en el proyecto de Katalon Studio del repositorio. Las pruebas se ejecutan localmente desde Katalon Studio. **NO DEBEN** usarse funciones que requieran Katalon Studio Enterprise ni Katalon Runtime Engine.

### Excepciones

Ninguna.

## Estructura de pruebas

**ID:** test-structure
**Estado:** Active

Los casos de prueba **DEBEN** vivir en `tests/katalon/Test Cases/US-<id>/`, con su script en `Scripts/` y sus Test Objects en `Object Repository/US-<id>/`. Las Test Suites **DEBEN** vivir en `tests/katalon/Test Suites/US-<id>/`.

El script de cada caso **DEBE** organizarse en tres bloques comentados: preparación, acción y verificación.

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

Los casos de prueba independientes **DEBEN** poder ejecutarse en paralelo (Test Suite Collection en modo paralelo), con usuarios o datos distintos. Una ejecución en paralelo no graba video ([ADR-003](../adr/ADR-003-katalon-execution-evidence.md)).

### Excepciones

Ninguna.

## Gestión de datos de prueba

**ID:** test-data
**Estado:** Active

> Decisión de origen: [ADR-007](../adr/ADR-007-katalon-test-data.md).

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

> Decisión de origen: [ADR-003](../adr/ADR-003-katalon-execution-evidence.md).

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

> Decisión de origen: [ADR-006](../adr/ADR-006-katalon-azure-devops-traceability.md).

Todo caso de prueba de Katalon que represente un Test Case de Azure DevOps **DEBE** comenzar su nombre con `TC-<id> - ` (por ejemplo `TC-1234 - User can login successfully`). El ID **DEBE** corresponder al Test Case real; el texto descriptivo **PUEDE** cambiar sin modificarlo. Un caso **NO DEBE** nombrar más de un Test Case. Un Test Case **PUEDE** respaldarse con varios casos cuando existan distintos escenarios técnicos para validarlo.

Tras ejecutar una Test Suite, los resultados **DEBEN** publicarse en Azure DevOps con el script de publicación del repositorio, que crea un test run en el Test Plan del proyecto y registra el resultado de cada Test Case a partir de su `TC-<id>`, **sin** depender de una asociación manual desde Test Plans. La asociación **DEBE** poder reconstruirse a partir de los nombres de los casos y del `JUnit_Report.xml`. El Personal Access Token de Azure DevOps **NO DEBE** versionarse.

### Excepciones

Los casos de prueba que no representan un Test Case de Azure DevOps no declaran identificador.

## Reportería con Allure

**ID:** allure-reporting
**Estado:** Active

> Decisión de origen: [ADR-004](../adr/ADR-004-katalon-allure-reporting.md).

Tras cada ejecución de una Test Suite, **DEBE** generarse un reporte de Allure a partir del `JUnit_Report.xml` que Katalon escribe en `Reports/`, convertido a `allure-results/` con las evidencias adjuntas por [scripts/katalon/junit-to-allure.mjs](../../scripts/katalon/junit-to-allure.mjs) (`npm run allure:katalon`). Los videos AVI o MOV del Screen Recorder se adjuntan convertidos a MP4 (H.264) cuando ffmpeg está disponible, para que se reproduzcan en el navegador. El reporte **DEBE** conservar el historial de ejecuciones, configurado en `allurerc.mjs`, para habilitar tendencias y detección de pruebas inestables, y **DEBE** adjuntarse al test run de Azure DevOps.

### Excepciones

Las ejecuciones de depuración de un caso suelto en Katalon Studio **PUEDEN** omitir el reporte de Allure.

## Jerarquía Historia, Criterio y Caso de prueba

**ID:** story-criterion-test-hierarchy
**Estado:** Active

> Decisión de origen: [ADR-004](../adr/ADR-004-katalon-allure-reporting.md).

Los casos de prueba **DEBERÍAN** organizarse en `Test Cases/` del proyecto Katalon con una carpeta por historia de usuario, `Test Cases/US-<id>/TC-<id> - título`. Los nombres **NO DEBEN** usar `:`, que no es válido en nombres de archivo.

El criterio de aceptación de cada caso **DEBE** tomarse de su especificación (`TC-<id>-*.md` en `docs/specs/`), que declara su criterio y su historia padre. En Allure, la historia **DEBE** registrarse como `feature` (`US-<id>: título`) y el criterio como `story` (`AC-<id>: título`).

### Excepciones

Los casos que no responden a un criterio de aceptación documentado no se agrupan.

## Tipos de prueba: Fully Automated y Human-in-the-Loop

**ID:** test-types
**Estado:** Active

> Decisión de origen: [ADR-005](../adr/ADR-005-katalon-human-in-the-loop.md).

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

## Criterios de cumplimiento

| ID     | Requisito                 | Descripción                                                                                                                                                               | Automatizable | Enfoque    | Verificación |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------- | ------------ |
| CR-001 | test-data                 | Los datos dinámicos y aislados **DEBEN** generarse con factories o builders                                                                                               | no            | —          | Pending      |
| CR-002 | test-data                 | Cada prueba **DEBE** crear los datos que necesita y **NO DEBE** depender de los que dejó otra prueba                                                                      | no            | —          | Pending      |
| CR-003 | test-data                 | Los recursos creados durante una prueba **DEBEN** eliminarse al finalizar cuando sea técnicamente posible                                                                 | no            | —          | Pending      |
| CR-004 | execution-evidence        | Los logs y los resultados de ejecución **DEBEN** estar disponibles para todas las ejecuciones                                                                             | yes           | bloqueante | Pending      |
| CR-005 | azure-devops-traceability | El nombre de todo caso de prueba que represente un Test Case **DEBE** comenzar con `TC-<id> - `, donde `<id>` es numérico                                                 | yes           | bloqueante | Pending      |
| CR-006 | azure-devops-traceability | El nombre de un caso de prueba **NO DEBE** contener más de un identificador `TC-<id>`                                                                                     | yes           | bloqueante | Pending      |
| CR-007 | azure-devops-traceability | La asociación resultado↔Test Case **DEBE** hacerse con el script de publicación del repositorio (API de Azure DevOps) y no de forma manual en Test Plans                  | no            | —          | Pending      |
| CR-008 | azure-devops-traceability | La asociación resultado↔Test Case **DEBE** poder reconstruirse a partir de los nombres de los casos y del `JUnit_Report.xml`                                              | yes           | warning    | Pending      |
| CR-009 | test-types                | Todo Test Case **DEBE** declarar su tipo (Fully Automated o Human-in-the-Loop) y, si es Human-in-the-Loop, **DEBE** indicar en sus pasos qué input se ingresa manualmente | no            | —          | Pending      |
| CR-010 | katalon-runner            | Las pruebas automatizadas **DEBEN** vivir en un proyecto de Katalon Studio en `tests/katalon/`, con su archivo `.prj`                                                     | yes           | bloqueante | Pending      |
| CR-011 | execution-evidence        | Las Test Suites de pruebas E2E web **DEBEN** grabar video de todas las ejecuciones, exitosas y fallidas, y no solo de los casos fallidos                                  | yes           | bloqueante | Pending      |

## Referencias

- [ADR-002: Katalon como runner único de pruebas](../adr/ADR-002-katalon-test-runner.md)
- [ADR-003: Evidencias de ejecución con Katalon](../adr/ADR-003-katalon-execution-evidence.md)
- [ADR-004: Reportería con Allure a partir de los resultados de Katalon](../adr/ADR-004-katalon-allure-reporting.md)
- [ADR-005: Pruebas Human-in-the-Loop con Katalon](../adr/ADR-005-katalon-human-in-the-loop.md)
- [ADR-006: Trazabilidad con Test Cases de Azure DevOps desde los resultados de Katalon](../adr/ADR-006-katalon-azure-devops-traceability.md)
- [ADR-007: Datos de prueba con Katalon](../adr/ADR-007-katalon-test-data.md)
