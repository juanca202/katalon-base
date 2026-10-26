# RS-002 — Factibilidad de Cypress y Screenplay como runners del proyecto base

<!-- rs:status=Ready -->

**Estado:** Ready
**Fecha:** 2026-10-19
**Flujo:** Investigación libre
**Artefacto referenciado:** N/A
**Creado por:** juanca202

## Pregunta de investigación

¿Es factible y conveniente incorporar Cypress y/o Screenplay (Serenity/JS y Serenity BDD) como runners adicionales en este framework, frente a [ADR-001](../../../../adr/ADR-001-test-runners.md) (Playwright + Maestro), [ADR-002](../../../../adr/ADR-002-page-object-model-pattern.md) (POM), [ADR-008](../../../../adr/ADR-008-azure-devops-test-case-traceability.md) (`TC-<id>`) y [ADR-009](../../../../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md) (Allure)? ¿Qué se necesita (instalación, licencias, CI/Azure DevOps, reportería), qué cubriría que hoy no cubre y qué se recomienda?

## Contexto

Dominio: **Técnica**. El repositorio es de QA sobre aplicaciones externas (`implementation.scope: tests`).

- Hoy hay dos runners: Playwright (E2E web desktop y mobile emulado, y APIs REST/GraphQL) y Maestro (apps nativas e híbridas). Ver [ADR-001](../../../../adr/ADR-001-test-runners.md) y [ADR-012](../../../../adr/ADR-012-playwright-web-desktop-and-mobile.md).
- Un runner nuevo exige registrarse en ADR-001 y en el catálogo `test-runners` de [testing.md](../../../../standards/testing.md) antes de crear su carpeta `tests/<runner>/`. El check CR-021 hace obligatorio que toda prueba viva en una carpeta de runner declarado.
- ADR-001 ya descartó Cypress por «limitaciones con iframes, múltiples tabs y testing de APIs menos robusto». Esta investigación revisa si esa razón sigue vigente.
- Stack verificado en `package.json`: `@playwright/test ^1.63.0`, `allure ^3.20.0`, `allure-playwright ^3.13.0`, `allure-js-commons 3.13.0`.
- Una búsqueda en el repo no encontró menciones previas de Cypress, Screenplay ni Serenity.
- Precedente: [RS-001 (Katalon)](../RS-001-katalon-flujo-pruebas/README.md).

**Screenplay no es un runner.** Es un patrón de diseño centrado en actores, tareas e interacciones. Lo evalúo en dos formas:

1. **Serenity/JS sobre Playwright Test.** Se integra con el runner existente.
2. **Serenity BDD.** Es la variante Java, con informes propios.

## Hallazgos

### 1. Cypress

**Versión y requisitos**

- La versión mayor vigente es Cypress 16.0.0 (1-sep-2026): HTTP/2 por defecto en Chrome, Chromium y Edge, Node.js 24, Electron 41, Chromium 146, y `Cypress.env()` eliminado ([release oficial](https://www.cypress.io/releases/16-0-0)).
- Un blog de terceros reporta además la 16.1.0 (15-sep-2026). No lo verifiqué contra npm ni contra el changelog oficial.
- El repo declara Node.js 20+ en `AGENTS.md`. Cypress 16 pide Node 24, así que adoptarlo obligaría a subir la versión de Node del proyecto o a fijar Cypress 15.x. Es una inferencia a partir de la nota de la release, que no indica el mínimo exacto.

**Limitaciones según la documentación oficial** ([trade-offs](https://docs.cypress.io/app/references/trade-offs.md))

- Cypress controla un solo navegador a la vez.
- Cada test queda acotado a un único superdominio. La navegación cross-origin requiere `cy.origin`.
- Varias pestañas: ya no se declara imposible. La guía dice que se pueden probar con el plugin `@cypress/puppeteer`. La razón de ADR-001 está **parcialmente desactualizada**.
- Iframes: soporte «algo limitado, pero funciona».
- Móvil: «no hay soporte de eventos nativos o móviles». No prueba apps nativas ni híbridas.
- Solo JavaScript/TypeScript. El código corre dentro del navegador.

**Navegadores:** Chrome-family, Firefox y WebKit ([guía cross-browser](https://docs.cypress.io/app/guides/cross-browser-testing.md)). La página no indica si WebKit es experimental. Otra fuente sugiere que lo es (`experimentalWebKitSupport`). **No verificado.**

**Reportería con Allure ([ADR-009](../../../../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md))**

- Existe `allure-cypress` ([doc oficial](https://allurereport.org/docs/cypress.md)): se configura con `allureCypress(on, config, { resultsDir })` en `setupNodeEvents` y `import "allure-cypress"` en el support file.
- Cypress 16 exige `allure-cypress` ≥ 3.12.2.
- Soporta jerarquía de comportamiento (epic/feature/story), pasos, parámetros, adjuntos (screenshots y video automáticos) y etiquetas.
- Genera `allure-results/`. Podría combinarse con el resto en un solo reporte, como ya se hace con Maestro. La doc no confirma explícitamente compatibilidad con Allure 3, aunque muestra el flujo con `allure generate`.
- La doc no menciona etiquetas de ID de Test Case. Una etiqueta personalizada vía `ALLURE_LABEL_*` parece posible, sin confirmar.
- La jerarquía `acceptanceCriterion()` de `src/helpers/traceability.ts` está escrita para Playwright. Habría que reimplementarla para Mocha/Cypress.

**CI y Azure DevOps**

- Cypress corre en Azure Pipelines. El patrón habitual es JUnit más la tarea «Publish Test Results» (fuentes de terceros). El reporter JUnit genera varios XML que hay que fusionar antes de publicar.
- La paralelización nativa pasa por Cypress Cloud (pago). Alternativas de terceros como Currents también son de pago.

**Costo**

- Cypress (la app) es de código abierto. No verifiqué la licencia en fuente oficial.
- Cypress Cloud es opcional. Fuentes secundarias (Vendr, Toolradar, EveryDev, CostBench) coinciden en un plan gratuito de 500 resultados al mes y discrepan en el límite de usuarios (3 vs. 50).
- Planes de pago citados: ~USD 799 al año (Team, 120.000 resultados) y ~USD 3.199 al año (Business). **Precios sin confirmar en la página oficial.**

**Lo que aportaría que Playwright no tiene**

- Depuración «time-travel» y Test Replay de Cloud.
- Un ecosistema y una curva de aprendizaje que algunos equipos ya conocen.

Para este repo ese valor es marginal. Playwright ya cubre multi-browser, trace viewer, API testing y viewport móvil con un solo runner. Cypress no cubre ningún hueco funcional del framework.

**Solapamientos a evitar**

- E2E web: duplicaría lo que hace Playwright.
- Mocks de red: se solaparía con MSW ([ADR-003](../../../../adr/ADR-003-msw-http-mocks.md)) y `cy.intercept`.

### 2. Screenplay con Serenity/JS sobre Playwright Test

- `@serenity-js/playwright-test` extiende Playwright Test con fixtures propias. Las pruebas Screenplay y las clásicas de Playwright pueden convivir en el mismo código ([handbook](https://serenity-js.org/handbook/test-runners/playwright-test)).
- Es **el mismo runner**. Se sigue ejecutando `playwright test`, con los mismos proyectos (`chromium`, `Mobile Chrome`, `api-tests`). No hay carpeta de runner nueva, así que no choca con CR-021/CR-022. Esto es una inferencia, porque no probé la instalación.
- `@serenity-js/web` aporta interacciones Screenplay (`Click`, `Enter`, `Ensure`…) sobre las APIs de Playwright.
- Reportería ([doc oficial](https://serenity-js.org/handbook/test-runners/playwright-test/reporting/)):
  - El reporter HTML de Serenity/JS no necesita Java y puede convivir en el array `reporter` con otros de Playwright.
  - Enriquece el reporte HTML nativo de Playwright, el UI Mode y el Trace Viewer con las actividades Screenplay.
  - La documentación revisada **no menciona Allure**, así que no puedo confirmar que `allure-playwright` y Serenity/JS convivan sin problemas. Lo infiero de que ambos son reporters independientes. **Requiere prueba.**
- Cuestiones abiertas sobre las reglas del repo, ninguna verificada:
  - ESLint valida que el título empiece por `TC-<id>` ([ADR-008](../../../../adr/ADR-008-azure-devops-test-case-traceability.md)). Habría que comprobar que la regla reconoce el `test` importado de Serenity/JS. El README ofrece además sintaxis BDD `describe`/`it`.
  - [ADR-002](../../../../adr/ADR-002-page-object-model-pattern.md) fija Page Objects con `BasePage`. Screenplay los sustituye por tareas e interacciones. Adoptarlo parcialmente exigiría enmendar ADR-002 o aislar su uso.
- El valor del patrón es de mantenibilidad: reutilización de tareas y legibilidad orientada al negocio. Aporta más cuando hay muchos flujos largos que se repiten con distintos roles. No resuelve ningún hueco de cobertura.

### 3. Screenplay con Serenity BDD (Java)

- El Serenity BDD Reporter necesita Java: el informe lo genera el Serenity BDD CLI, que es un programa Java, más paquetes extra (`@serenity-js/serenity-bdd`, `npm-failsafe`, `rimraf`) y scripts de generación.
- Añade una segunda cadena de reportería, junto a Allure, y una dependencia de JVM en CI. Contradice la idea de ADR-009 de un único reporte.
- No hay ningún hueco funcional que justifique el costo.
- Serenity BDD en sí, con su propio runner Java o Cucumber, **no se investigó en profundidad**.

### 4. Choque con las decisiones vigentes

| Decisión vigente                                                                                                                                                 | Cypress como runner                                                                  | Serenity/JS sobre Playwright                                   | Serenity BDD (Java)         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------- |
| [ADR-001](../../../../adr/ADR-001-test-runners.md) / [testing.md](../../../../standards/testing.md) `test-runners`                                               | Requiere runner nuevo y carpeta nueva. Contradice la alternativa descartada          | No es runner nuevo                                             | Segundo stack               |
| [ADR-002](../../../../adr/ADR-002-page-object-model-pattern.md) POM                                                                                              | Tendría que reimplementarse en Cypress                                               | Sustituye el POM por tareas e interacciones. Requiere enmienda | Ídem                        |
| [ADR-008](../../../../adr/ADR-008-azure-devops-test-case-traceability.md) `TC-<id>` + ESLint                                                                     | La regla actual es de `eslint-plugin-playwright`. Habría que reescribirla para Mocha | Por verificar                                                  | Fuera del alcance de ESLint |
| [ADR-009](../../../../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md) / [ADR-007](../../../../adr/ADR-007-execution-evidence.md) Allure y evidencias | `allure-cypress` existe; el trace de Playwright no existe en Cypress                 | Convivencia con `allure-playwright` por verificar              | Dos reportes                |
| Node 20+ en `AGENTS.md`                                                                                                                                          | Cypress 16 pide Node 24                                                              | Sin cambio                                                     | Más JVM                     |

## Decisiones pendientes / opciones evaluadas

- **Cypress**
  - **A. Añadirlo como tercer runner** (`tests/cypress/`): duplica Playwright y exige subir Node o fijar Cypress 15.
  - **B. No añadirlo** y mantener ADR-001.
  - **C. Solo para un caso concreto** (por ejemplo, el cliente ya tiene su suite en Cypress): evaluarlo entonces, con ADR propio.
  - **Recomendación: B.** Cypress no cubre ningún hueco (no hace mobile nativo, no mejora el API testing y no aporta multi-tab ni multi-browser simultáneo). La razón de ADR-001 está parcialmente desactualizada (multi-tab ya tiene vía de solución), pero el balance sigue igual. Si se acepta, conviene actualizar la redacción de ese ADR.
- **Screenplay**
  - **A. Serenity/JS sobre Playwright**, como alternativa opcional al POM y sin runner nuevo.
  - **B. Serenity BDD (Java)** con su cadena de reporte.
  - **C. No adoptarlo.**
  - **Recomendación: C como línea base.** Si el equipo valora el patrón, hacer una PoC acotada de A. **Descartar B.**

## Conclusión y recomendación

1. **Cypress no conviene como runner del framework.** Duplica a Playwright en web y no cubre móvil nativo. Costaría reescribir POM, regla ESLint de `TC-<id>` y helper de trazabilidad, y subir a Node 24 (o quedarse en Cypress 15). El único coste que esquivaría sería reescribir pruebas si el equipo ya las tuviera en Cypress, y no es el caso.
2. **Screenplay es un patrón, no un runner.** No cabe como tercer runner en `tests/<runner>/`. Serenity/JS corre dentro de Playwright Test, así que técnicamente es factible sin tocar ADR-001. El impacto está en ADR-002 (POM) y posiblemente en la regla ESLint de ADR-008.
3. **Serenity BDD (Java) queda descartado** por la JVM en CI y el segundo reporte.
4. **No registrar ningún runner nuevo en ADR-001 ni en testing.md.**
5. **Si se quiere explorar Screenplay**, una PoC de 1–2 días con un spike (`work-plan`) debe responder:
   - ¿`allure-playwright` y el reporter de Serenity/JS conviven sin pérdida de datos en `allure-results/`?
   - ¿La regla ESLint de `TC-<id>` acepta el `test` o `describe`/`it` de Serenity/JS?
   - ¿`acceptanceCriterion()` sigue funcionando con las fixtures de Serenity/JS?
   - ¿Cuál es la compatibilidad de versiones con Playwright 1.63 y TypeScript 6?

**Incertidumbres:**

- No instalé ninguna de las herramientas.
- Varias fuentes de Cypress son blogs de terceros (16.1.0, WebKit experimental, precios de Cloud).
- La documentación de Serenity/JS que revisé no menciona Allure.
- No se verificó la licencia de Cypress ni la de Serenity/JS en fuente oficial.
- No investigué Cucumber ni Serenity BDD como runner propio más allá de lo indicado.

## Archivos adicionales

Ninguno.

## Impacto en el artefacto / próximo paso

N/A — investigación independiente.

Próximo paso si se quiere seguir: `work-plan` (WI tipo spike con timebox para la PoC de Serenity/JS sobre Playwright). Si se acepta el descarte de Cypress, conviene refrescar la nota de «limitaciones» de la alternativa en [ADR-001](../../../../adr/ADR-001-test-runners.md) vía `arch-manage`.

## Fuentes

- [Cypress 16.0.0](https://www.cypress.io/releases/16-0-0)
- [Cypress: permanent trade-offs](https://docs.cypress.io/app/references/trade-offs.md)
- [Cypress: cross-browser testing](https://docs.cypress.io/app/guides/cross-browser-testing.md)
- [Allure Cypress](https://allurereport.org/docs/cypress.md)
- [Allure 3: migración](https://allurereport.org/docs/v3/migrate/)
- [Serenity/JS: Playwright Test](https://serenity-js.org/handbook/test-runners/playwright-test)
- [Serenity/JS: reportería con Playwright Test](https://serenity-js.org/handbook/test-runners/playwright-test/reporting/)
- [Serenity/JS: Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/)
- [Cypress Cloud Free Plan (CostBench, secundaria)](https://costbench.com/software/browser-testing/cypress-cloud/free-plan/)
- [Cypress en Vendr (secundaria)](https://www.vendr.com/marketplace/cypress-io)
- [Cypress v16.1.0 (qaskills.sh, secundaria)](https://qaskills.sh/blog/cypress-16-new-features-migration-guide)
- [Cypress en Azure DevOps (BrowserStack, secundaria)](https://browserstack.com/guide/run-cypress-tests-in-azure-devops)
