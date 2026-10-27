---
id: ADR-014
status: Draft
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, mocks, isolation, network, katalon, cdp]
supersedes: null
superseded_by: null
emits: []
---

# ADR-014: Pruebas contra ambientes reales y simulación de red puntual

## Contexto

Las pruebas se ejecutan contra el sistema desplegado ([ADR-011](ADR-011-test-environments.md)). Algunos escenarios no se pueden provocar en un ambiente real: que falle la carga de un recurso, que un servicio responda con error o que tarde más de lo esperado. Katalon Studio no intercepta la red de forma nativa; la intercepción en Chrome es posible mediante Chrome DevTools Protocol, con el plugin _Chrome DevTools Protocol Integration_ de Katalon Store.

## Decisión

- **Por defecto, las pruebas corren contra el ambiente real**, sin simulaciones: lo que se valida es el comportamiento del sistema desplegado.
- **Simulación de red solo para escenarios de error** que no se pueden provocar de otra forma, en pruebas web con Chrome, mediante un Custom Keyword sobre el plugin _Chrome DevTools Protocol Integration_: bloquear una URL, responder con un estado de error o con un cuerpo concreto.
- **Toda prueba con simulación lo declara** en su Test Case y en el nombre de su Test Suite, para que su resultado no se confunda con el del sistema real.
- **Apps móviles y navegadores distintos de Chrome:** sin simulación de red. Los escenarios de error que la requieran quedan como pruebas manuales.

## Alternativas consideradas

- **Proxy de simulación externo** (por ejemplo, un proxy HTTP con reglas): sirve para web y móvil, pero añade un servicio que instalar y configurar en cada equipo.
- **Sin simulación:** los escenarios de error quedan siempre como pruebas manuales.

## Consecuencias

### Positivas

- Las pruebas reflejan el comportamiento real del sistema.
- Los escenarios de error de carga se pueden automatizar en web sin servicios adicionales.

### Negativas / trade-offs

- Depende de un plugin de Katalon Store y de la compatibilidad de Chrome DevTools Protocol con la versión de Chrome.
- La simulación solo cubre Chrome; en móvil esos escenarios quedan manuales.
- Las pruebas contra ambientes reales dependen de su disponibilidad y de sus datos.

## Referencias

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-010: Reutilización de flujos con Custom Keywords y casos comunes](ADR-010-katalon-reusable-flows.md)
- [ADR-011: Ambientes de ejecución y política de pruebas en producción](ADR-011-test-environments.md)
- [Foro de Katalon: interceptar peticiones con Chrome DevTools Protocol](https://forum.katalon.com/t/intercepting-request-with-chrome-devtools-protocol/36081)
