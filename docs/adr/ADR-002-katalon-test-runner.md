---
id: ADR-002
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, katalon, runners, e2e, api, mobile]
supersedes: null
superseded_by: null
emits: [testing/CR-010]
---

# ADR-002: Katalon como runner único de pruebas

## Contexto

El framework prueba aplicaciones externas sin acceso al código fuente: sitios web, APIs HTTP y apps nativas o híbridas de Android e iOS. Hace falta un runner que cubra los tres tipos de prueba con una sola herramienta, una sola instalación y una sola forma de reportar, y que el equipo de QA pueda usar sin escribir un framework propio.

## Decisión

**Katalon Studio**, en su edición gratuita, es el runner único de pruebas automatizadas del framework para:

| Tipo de prueba                        | Runner         |
| ------------------------------------- | -------------- |
| E2E web (escritorio y viewport móvil) | Katalon Studio |
| APIs REST y GraphQL                   | Katalon Studio |
| Apps nativas o híbridas Android e iOS | Katalon Studio |

Las pruebas se organizan como un proyecto de Katalon Studio en `tests/katalon/` y se ejecutan **localmente desde Katalon Studio** (Test Suites y Test Suite Collections). No se usan Katalon Studio Enterprise ni Katalon Runtime Engine: lo que en Katalon requiere esas licencias se resuelve con alternativas propias del repositorio (ver [ADR-003](ADR-003-katalon-execution-evidence.md) a [ADR-007](ADR-007-katalon-test-data.md)).

La edición gratuita no admite ejecución por línea de comandos, así que las pruebas no corren en CI.

## Consecuencias

### Positivas

- Un solo runner que instalar, configurar y aprender para web, API y móvil, sin costo de licencia.
- Object Repository, keywords y perfiles de ejecución compartidos entre los tres tipos de prueba.
- Una sola fuente de resultados para la reportería y la trazabilidad con Azure DevOps.

### Negativas / trade-offs

- **Las pruebas no corren en CI:** la ejecución es manual desde Katalon Studio, en el equipo de quien prueba. No hay ejecución programada ni regresión automática en cada build.
- La edición gratuita limita el proyecto a 40 Test Suites y no incluye reintentos automáticos de casos fallidos, data binding en Test Suites, self-healing ni la integración nativa con Azure Test Plans.
- Las pruebas se escriben en Groovy en lugar de TypeScript.
- Dependencia de un producto comercial cuya edición gratuita puede cambiar de alcance.

## Referencias

- [Testing Standards](../standards/testing.md): requisito `katalon-runner`
- [Documentación de Katalon](https://docs.katalon.com/)
