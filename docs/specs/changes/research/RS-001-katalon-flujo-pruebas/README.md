# RS-001 — Integración de Katalon en el flujo de pruebas: generar test cases y automatizar

<!-- rs:status=Ready -->

**Estado:** Ready
**Fecha:** 2026-10-19
**Flujo:** Investigación libre
**Artefacto referenciado:** N/A
**Creado por:** juanca202

## Pregunta de investigación

¿Qué implica integrar Katalon en este framework (Playwright + TypeScript + Allure + Azure DevOps) para cubrir el flujo de pruebas completo, desde generar test cases hasta automatizarlos? ¿Qué es lo mínimo necesario para crear las pruebas automatizadas (solo CLI u otra cosa)? ¿Qué rol tendría frente a lo que ya existe (`test-define`/`TC-XXX`, Playwright, Maestro)?

## Contexto

El repositorio es de QA sobre aplicaciones externas (`implementation.scope: tests`). Hoy el flujo es:

- Los Test Cases viven en Azure DevOps.
- `test-define` los redacta.
- Las pruebas se automatizan en Playwright + TypeScript con Page Object Model.
- Cada prueba lleva su `TC-<id>` en el título ([ADR-008](../../../../adr/ADR-008-azure-devops-test-case-traceability.md)).
- Allure reporta ([ADR-009](../../../../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md)).
- Maestro cubre mobile ([ADR-011](../../../../adr/ADR-011-maestro-mobile-app-runner.md)).

No hay ninguna mención previa de Katalon en el repo (búsqueda en todo el árbol, sin `node_modules`). La integración con gestor de proyectos está desactivada en `.sdd-devkit/settings.json`.

## Hallazgos

### 1. Qué piezas de Katalon hay y cuál hace qué

| Pieza                                                                  | Función                                                                          | Licencia                                                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Katalon Studio**                                                     | IDE donde se **crean** y ejecutan pruebas en modo GUI.                           | Gratis según fuentes secundarias. Studio Enterprise es de pago.                          |
| **Katalon Runtime Engine (KRE)**, hoy «Katalon Test Execution – Local» | **Ejecuta** proyectos ya creados por línea de comandos (`katalonc`) o en CI/CD.  | De pago. Studio Enterprise solo cubre ejecución con GUI.                                 |
| **Katalon True Platform (incl. TestOps)**                              | Gestión de requisitos y test cases, ejecución en la nube, reportes, MCP servers. | Planes Free/Premium/Ultimate según fuentes secundarias. No confirmado en fuente oficial. |

**Conclusión sobre la CLI:** `katalonc` **no sirve para crear pruebas, solo para ejecutarlas**. Crear pruebas automatizadas con Katalon exige Katalon Studio (IDE) o su asistente de IA dentro de Studio. La CLI es el requisito mínimo solo para ejecutar en pipeline, y necesita licencia de pago.

### 2. Generar test cases

- **StudioAssist, modo Agent** (dentro de Studio). Crea y actualiza activos de prueba usando herramientas MCP: test cases y scripts, custom keywords, test suites, data tables, feature files Gherkin con step definitions en Groovy, y entradas del Object Repository. Servidores MCP integrados: Katalon, Katalon Studio y Katalon True Platform. Admite MCP externos.
  - Requiere configurar un proveedor de IA en Studio. Versiones mínimas: 11.1.0 para diagnóstico de fallos, y 10.4.0 para MCP externos con autenticación.
  - Limitaciones declaradas: puede llamar mal a las herramientas, los test cases generados pueden omitir imports, y la memoria del chat es local.
  - La documentación no indica licencia o plan requerido.
- **Desde Jira.** Guía oficial con el MCP de Atlassian: criterios de aceptación → test case, más casos borde (Studio ≥ 10.3.2).
- **Desde Azure DevOps** (True Platform). Se sincronizan requisitos y planes de release desde ADO. Los requisitos pueden **generar test cases con trazabilidad**. Un test case de Katalon se **vincula** a uno o más Test Cases de ADO Test Plans (es un enlace, no una copia). También se pueden importar test cases de ADO como copias.
- **MCP consolidado (resumen de mayo de 2026).** Katalon afirma que «cualquier agente» puede crear test cases, vincular requisitos y armar suites vía su MCP. Es información de marketing. No verifiqué que un agente externo como Claude Code pueda usarlo.

El sentido documentado es **ADO → Katalon** para requisitos, y **Katalon → ADO** para resultados y bugs. **No encontré documentación de que Katalon cree Test Cases nativos en ADO Test Plans con su `TC-<id>`.** Esto es crítico para [ADR-008](../../../../adr/ADR-008-azure-devops-test-case-traceability.md) y queda como pendiente de verificar.

### 3. Automatizar

- Las pruebas de Katalon Studio son proyectos propios (Object Repository, keywords, test suites). La documentación revisada habla de scripts y step definitions en **Groovy**, no TypeScript. Esto lo infiero de esa documentación y no lo verifiqué contra una página de lenguajes soportados.
- Katalon **no ejecuta de forma nativa pruebas Playwright en TypeScript** dentro de Studio. No lo encontré documentado, y un hilo del foro oficial indica que no estaba disponible. Es una fuente débil, no un anuncio oficial.
- **Novedad (no verificada en profundidad):** la página «Bring Playwright into Katalon» (webinar grabado el 14-oct-2026) ofrece traer el repositorio Playwright **tal cual**, ejecutarlo en runners cloud gestionados y consolidar resultados, flakiness y tendencias en True Platform. No indica producto, plan ni precio.

### 4. Ejecución en CI y Azure DevOps

- La CLI sigue este patrón: `katalonc -runMode=console -projectPath=<ruta absoluta .prj> -testSuitePath=<ruta sin .ts> -apiKey=<key>`. Los foros reportan fallos frecuentes: rutas, licencia activada con API key de otra cuenta, y ejecuciones que terminan sin correr pruebas. No pude confirmar la lista oficial de códigos de salida.
- La licencia de ejecución es **flotante: una sesión por licencia**. Ejecutar n sesiones a la vez requiere n licencias.
- **Extensión «Katalon for Azure DevOps»** (Marketplace): ejecuta pruebas Katalon en pipelines. Requiere la licencia de ejecución local.
- **Integración con Azure Test Plans desde Studio:** envía runs y resultados a ADO. Requiere licencia Enterprise activa y un PAT.
- **Integración True Platform ↔ ADO:** autorización con URL de organización y PAT, webhooks, y push manual o automático de resultados. La documentación no menciona licencias.

### 5. Costo

Las fuentes secundarias **se contradicen** en nombres de planes y precios. Por ejemplo, el Runtime Engine aparece desde unos $49 hasta ~$2,400 por licencia al año. Solo hay consenso en que Studio es gratis y que el costo real está en la **licencia de ejecución**. No hay cifra confiable. Debe confirmarse con Katalon (`business@katalon.com`, que la documentación indica para licencias offline o mixtas). Según un foro, el trial solo se concede a cuentas con correo corporativo.

### 6. Choque con las decisiones vigentes

| Decisión vigente                                                                                                                                                 | Efecto de adoptar Katalon Studio como motor de automatización                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [ADR-001](../../../../adr/ADR-001-test-runners.md) Playwright como framework                                                                                     | Contradice la decisión: sería un segundo motor, con otro lenguaje (Groovy).                  |
| [ADR-002](../../../../adr/ADR-002-page-object-model-pattern.md) POM                                                                                              | Katalon usa Object Repository, un patrón distinto.                                           |
| [ADR-008](../../../../adr/ADR-008-azure-devops-test-case-traceability.md) `TC-<id>` en el título (lint ESLint)                                                   | ESLint no valida proyectos Katalon. La trazabilidad dependería de la integración de Katalon. |
| [ADR-009](../../../../adr/ADR-009-allure-reporting-and-traceability-hierarchy.md) / [ADR-007](../../../../adr/ADR-007-execution-evidence.md) Allure y evidencias | Los resultados y evidencias vivirían en Katalon, no en el reporte Allure único.              |
| `AGENTS.md`: «Playwright + TypeScript»                                                                                                                           | Cambiaría el stack.                                                                          |

## Decisiones pendientes / opciones evaluadas

- **Rol de Katalon**
  - **A. Solo generación de test cases:** True Platform o StudioAssist generan los TC desde requisitos de ADO; la automatización sigue en Playwright.
  - **B. Reemplazar la automatización:** Studio para crear + KRE para ejecutar.
  - **C. Mantener Playwright y usar Katalon como plataforma de ejecución y reporte** (Bring Playwright).
  - **D. No usar Katalon:** el flujo actual ya cubre generación (`test-define` + MCP de ADO) y automatización (`work-implement`).
- **Recomendación:** **D como línea base. Si hay interés en la generación asistida por IA, hacer una prueba de concepto acotada de A. Descartar B.**
  - **B:** viola ADR-001/002, añade Groovy, cuesta una licencia de ejecución por sesión y fragmenta el reporte.
  - **C:** duplica lo que ya hacen Allure y Azure Pipelines, y no está claro de qué plan depende.
  - **A:** es el único que aporta algo nuevo sin tocar la automatización, pero hay que verificar el punto crítico: llevar los TC generados a ADO con su `TC-<id>`.

## Conclusión y recomendación

1. **Lo mínimo para crear pruebas automatizadas con Katalon no es la CLI.** Se necesita Katalon Studio (IDE) y, para ejecutar en pipeline, además una licencia de ejecución de pago.
2. **Katalon no encaja como motor de automatización** de este repo: contradice ADR-001, ADR-002, ADR-008 y ADR-009, y el stack declarado en `AGENTS.md`.
3. **Lo que sí podría aportar** es la generación asistida de test cases desde requisitos. Recomiendo, solo si esa capacidad interesa, una **prueba de concepto de 1–2 días con trial** que responda:
   - ¿Los test cases generados se pueden crear o sincronizar en ADO Test Plans con ID propio (`TC-<id>`) y no solo vincularse?
   - ¿El MCP de True Platform se puede usar desde un agente externo (Claude Code)?
   - ¿Qué plan o licencia exige realmente el modo Agent y la integración con ADO?
   - ¿Cuál es el costo real de la licencia de ejecución, si se quisiera la opción C?
4. **No decidir licencias ni cambiar ADR** hasta tener esas respuestas. Si la prueba de concepto resulta favorable, el cambio sería documentarlo vía `arch-manage` como complemento de ADR-008, no como sustituto de ADR-001.

**Incertidumbres:** la mayoría de las fuentes son documentación y marketing de Katalon, sin reseñas independientes. Los precios proceden de fuentes secundarias contradictorias. La oferta «Bring Playwright» es de hace pocos días y su alcance no está claro.

## Impacto en el artefacto / próximo paso

N/A — investigación independiente.

Próximo paso si se quiere seguir: `arch-manage` (complemento de ADR-008) o `work-plan` (WI tipo spike con timebox para la prueba de concepto).

## Fuentes

- [Katalon Runtime Engine floating license](https://docs.katalon.com/katalon-platform/administer/katalon-studio-enterprise-and-katalon-runtime-engine-license/katalon-runtime-engine-floating-license)
- [Command line syntax in Katalon Runtime Engine](https://docs.katalon.com/katalon-studio/execute-tests/katalon-runtime-engine/command-line-syntax-in-katalon-runtime-engine)
- [StudioAssist Agent mode](https://docs.katalon.com/katalon-studio/studioassist/studioassist-agent-mode)
- [Atlassian MCP server best practices (Katalon)](https://docs.katalon.com/katalon-studio/studioassist/mcp-servers/atlassian-mcp-server-best-practices)
- [Katalon product roundup, mayo 2026](https://katalon.com/resources-center/blog/katalon-product-roundup-may-2026)
- [Azure DevOps integration, Katalon Platform](https://docs.katalon.com/katalon-platform/integrations/alm-and-test-management/azure-devops-integration)
- [Azure DevOps integration (CI/CD)](https://docs.katalon.com/katalon-platform/integrations/cicd-integrations/azure-devops-integration)
- [Configure Azure DevOps Test Plans integration in Katalon Studio](https://docs.katalon.com/katalon-studio/integrations/test-management/configure-azure-devops-test-plans-integration-in-katalon-studio)
- [Katalon and Playwright (webinar, 14-oct-2026)](https://katalon.com/webinars/bring-playwright-into-katalon)
- [Is Katalon compatible with Playwright tests? (foro)](https://forum.katalon.com/t/is-katalon-compatible-with-playwright-tests/86191)
- [Katalon Pricing (bug0, secundaria)](https://bug0.com/knowledge-base/katalon-pricing)
- [Katalon Pricing (getautonoma, secundaria)](https://getautonoma.com/blog/katalon-pricing)
