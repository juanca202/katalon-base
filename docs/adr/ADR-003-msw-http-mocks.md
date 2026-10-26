---
id: ADR-003
status: Deprecated
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [msw, testing, http, mocks]
supersedes: null
superseded_by: null
emits: [testing/CR-002]
---

# ADR-003: Mock Service Worker para mocks de APIs HTTP

## Contexto

El framework prueba aplicaciones externas con Playwright y no incluye pruebas unitarias ni de integración. Cuando hace falta simular una API HTTP sin backend —en el navegador o en desarrollo local— el equipo usa un único mecanismo.

La suite E2E se ejecuta contra flujos reales o con los mecanismos de red de Playwright, y no exige ese mecanismo.

## Decisión

Se adopta **Mock Service Worker (MSW)** como mecanismo para simular APIs HTTP fuera de la suite de pruebas.

- Este repositorio no contempla pruebas unitarias ni de integración, así que no hay obligación de arrancar el server o el worker de MSW en una suite de test.
- En el navegador o en herramientas de desarrollo local, MSW puede simular APIs sin backend.
- La suite E2E con Playwright no exige MSW.

## Consecuencias

### Positivas

- Un solo mecanismo si el equipo simula APIs HTTP en el navegador o en local.
- La suite E2E sigue apoyándose en flujos reales o en Playwright.

### Negativas / trade-offs

- MSW queda como opción del navegador y del desarrollo local.
- Una suite unitaria o de integración futura necesita su propia decisión de mock HTTP.

## Referencias

- [Estándar de Testing](../standards/testing.md) — requisito «Mocks de APIs HTTP»
- [ADR-001: Runners de pruebas: Playwright y Maestro](ADR-001-test-runners.md)
- [Mock Service Worker](https://mswjs.io/)
- Deprecated el 2026-10-26: deja de estar vigente al adoptar Katalon como runner único ([ADR-013](ADR-013-katalon-test-runner.md)).
