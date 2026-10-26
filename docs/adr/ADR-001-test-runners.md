---
id: ADR-001
status: Accepted
last_update: 2026-10-19
deciders: [Equipo de QA]
tags: [testing, playwright, maestro, runners, e2e, api, mobile]
supersedes: null
superseded_by: null
emits: [testing/CR-021, testing/CR-022]
---

# ADR-001: Runners de pruebas: Playwright y Maestro

## Contexto

El framework prueba aplicaciones externas sin acceso al código fuente. Esas aplicaciones son de tipos distintos (sitios web, APIs HTTP, apps nativas o híbridas de Android e iOS) y ningún runner único las cubre todas con la misma calidad. El framework debe declarar qué runners tiene disponibles y para qué sirve cada uno, de modo que quien automatice una prueba sepa qué runner usar sin tener que decidirlo caso a caso.

Drivers de la elección:

- Playwright soporta Chromium, Firefox y WebKit de forma nativa, con TypeScript, y permite probar UI y APIs REST y GraphQL con el mismo runner.
- Su trace viewer y su inspector aceleran el diagnóstico, y corre en pipelines automatizados.
- Playwright solo emula viewports móviles dentro de un navegador: no ejecuta apps nativas ni híbridas instaladas en Android o iOS.
- Maestro prueba esas apps como caja negra, con flujos YAML declarativos compartidos entre Android e iOS y resultados exportables a JUnit ([ADR-011](ADR-011-maestro-mobile-app-runner.md)).

## Decisión

El framework dispone de dos runners de pruebas. Cada tipo de prueba se automatiza con el runner que le corresponde:

| Runner         | Se usa para                                                                | Carpeta             |
| -------------- | -------------------------------------------------------------------------- | ------------------- |
| **Playwright** | E2E web (incluido el viewport móvil de un navegador) y APIs REST y GraphQL | `tests/playwright/` |
| **Maestro**    | Apps nativas o híbridas Android e iOS                                      | `tests/maestro/`    |

Ningún runner es exclusivo: cada prueba vive en la carpeta de su runner y las reglas de cada uno se detallan en su propio ADR ([ADR-005](ADR-005-playwright-api-request-context.md) para las APIs, [ADR-011](ADR-011-maestro-mobile-app-runner.md) para las apps móviles).

Incorporar un runner nuevo exige registrarlo en este ADR y en el catálogo del estándar de Testing antes de añadir su carpeta de pruebas.

## Alternativas consideradas

- **Cypress**: limitaciones con iframes, múltiples tabs y testing de APIs menos robusto.
- **Selenium WebDriver**: mayor complejidad de configuración y mantenimiento.
- **Puppeteer**: solo soporta Chromium, sin soporte nativo para Firefox ni Safari.
- **Appium** (apps móviles): exige servidor, drivers y código por plataforma; ver [ADR-011](ADR-011-maestro-mobile-app-runner.md).
- **Un único runner para todo**: ninguno cubre web, APIs y apps nativas sin sacrificar calidad en alguno de los tres.

## Consecuencias

### Positivas

- Cada tipo de prueba tiene un runner declarado y una carpeta propia: `tests/playwright/` y `tests/maestro/`.
- Playwright unifica UI y API testing y ofrece soporte multi-browser y herramientas de debugging avanzadas.
- Maestro cubre las apps nativas o híbridas que Playwright no puede probar.

### Negativas / trade-offs

- Más de un runner que mantener: instalación, configuración y capacitación para cada uno.
- Los runners no comparten Page Objects ni helpers; la reportería y la trazabilidad de Maestro se resuelven vía JUnit ([ADR-008](ADR-008-azure-devops-test-case-traceability.md)).
- Curva de aprendizaje para un equipo familiarizado con otros frameworks.
- Dependencia de la evolución de Playwright (Microsoft) y de Maestro.

## Referencias

- [Playwright](https://playwright.dev/)
- [Maestro](https://docs.maestro.dev)
- [Estándar de Testing](../standards/testing.md): requisito `test-runners`
- [ADR-005: APIRequestContext de Playwright para pruebas REST y GraphQL](ADR-005-playwright-api-request-context.md)
- [ADR-011: Maestro como runner de pruebas de apps Android e iOS](ADR-011-maestro-mobile-app-runner.md)
