---
id: ADR-005
status: Accepted
last_update: 2026-09-22
deciders: [Equipo de QA]
tags: [playwright, api, rest, graphql]
supersedes: null
superseded_by: null
emits: [testing/CR-003]
---

# ADR-005: APIRequestContext de Playwright para pruebas REST y GraphQL

## Contexto

El framework prueba APIs HTTP de aplicaciones externas, tanto REST como GraphQL, sin acceso al código fuente. Esas pruebas tienen que compartir runner, configuración, cabeceras y trazas con el resto de la suite de Playwright.

Las pruebas de API de ejemplo ya llaman a la fixture `request`, que es un `APIRequestContext`.

## Decisión

Las pruebas REST y GraphQL usan **APIRequestContext** de Playwright.

Ese contexto es el cliente HTTP de la suite: la fixture `request` y, cuando la prueba ya tiene una página, `page.request`.

## Consecuencias

### Positivas

- REST y GraphQL salen por el mismo cliente y la misma configuración de entorno.
- La autenticación, las cabeceras y las trazas quedan en el runner de Playwright.
- La suite de API no añade otro cliente HTTP.

### Negativas / trade-offs

- GraphQL se expresa como HTTP sobre `APIRequestContext`.
- La suite queda atada al cliente de Playwright para este tipo de pruebas.

## Referencias

- [ADR-001: Runners de pruebas: Playwright y Maestro](ADR-001-test-runners.md)
- [Estándar de Testing](../standards/testing.md) — requisito «Pruebas REST y GraphQL»
- [APIRequestContext](https://playwright.dev/docs/api/class-apirequestcontext)
