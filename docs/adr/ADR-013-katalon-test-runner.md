---
id: ADR-013
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, katalon, runners, e2e, api, mobile]
supersedes: [ADR-001, ADR-011, ADR-012]
superseded_by: null
emits: [testing/CR-024]
---

# ADR-013: Katalon como runner único de pruebas

## Contexto

El framework prueba aplicaciones externas sin acceso al código fuente: sitios web, APIs HTTP y apps nativas o híbridas de Android e iOS. Hasta ahora esa cobertura se repartía entre dos runners: Playwright para la web y las APIs ([ADR-001](ADR-001-test-runners.md), [ADR-012](ADR-012-playwright-web-desktop-and-mobile.md)) y Maestro para las apps móviles ([ADR-011](ADR-011-maestro-mobile-app-runner.md)).

Mantener dos runners implica dos instalaciones, dos configuraciones, dos formas de reportar y dos curvas de aprendizaje, sin Page Objects ni helpers compartidos entre ellos. El equipo de QA decidió concentrar la automatización en una sola herramienta que cubra los tres tipos de prueba.

## Decisión

**Katalon Studio**, en su edición gratuita, es el runner único de pruebas automatizadas del framework y reemplaza a Playwright y a Maestro para:

| Tipo de prueba                        | Antes      | Ahora          |
| ------------------------------------- | ---------- | -------------- |
| E2E web (escritorio y viewport móvil) | Playwright | Katalon Studio |
| APIs REST y GraphQL                   | Playwright | Katalon Studio |
| Apps nativas o híbridas Android e iOS | Maestro    | Katalon Studio |

Las pruebas se organizan como un proyecto de Katalon Studio en `tests/katalon/` y se ejecutan **localmente desde Katalon Studio** (Test Suites y Test Suite Collections). No se usan Katalon Studio Enterprise ni Katalon Runtime Engine: lo que en Katalon requiere esas licencias se resuelve con alternativas propias del repositorio (ver [ADR-014](ADR-014-katalon-execution-evidence.md) a [ADR-018](ADR-018-katalon-test-data.md)).

El pipeline de Azure DevOps no ejecuta las pruebas, porque la edición gratuita no admite ejecución por línea de comandos; ejecuta las validaciones estáticas (CodeNarc, `npm run arch`, lint).

Esta decisión supersede a [ADR-001](ADR-001-test-runners.md), [ADR-011](ADR-011-maestro-mobile-app-runner.md) y [ADR-012](ADR-012-playwright-web-desktop-and-mobile.md).

## Consecuencias

### Positivas

- Un solo runner que instalar, configurar y aprender para web, API y móvil, sin costo de licencia.
- Object Repository, keywords y perfiles de ejecución compartidos entre los tres tipos de prueba.
- Una sola fuente de resultados para la reportería y la trazabilidad con Azure DevOps.

### Negativas / trade-offs

- **Las pruebas no corren en CI:** la ejecución es manual desde Katalon Studio, en el equipo de quien prueba. No hay ejecución programada ni regresión automática en cada build.
- La edición gratuita limita el proyecto a 40 Test Suites y no incluye reintentos automáticos de casos fallidos, data binding en Test Suites, self-healing ni la integración nativa con Azure Test Plans.
- Hay que migrar o reescribir lo que hoy depende de Playwright y Maestro: Page Objects en TypeScript, helpers, scripts de `package.json`, `playwright.config.ts`, `scripts/maestro/` y el pipeline.
- Las pruebas se escriben en Groovy en lugar de TypeScript.
- Dependencia de un producto comercial cuya edición gratuita puede cambiar de alcance.

## Referencias

- [Testing Standards](../standards/testing.md): requisito `katalon-runner`
- [ADR-001: Runners de pruebas: Playwright y Maestro](ADR-001-test-runners.md) (superseded)
- [ADR-011: Maestro como runner de pruebas de apps Android e iOS](ADR-011-maestro-mobile-app-runner.md) (superseded)
- [ADR-012: Playwright para pruebas web desktop y web mobile](ADR-012-playwright-web-desktop-and-mobile.md) (superseded)
- [Documentación de Katalon](https://docs.katalon.com/)
