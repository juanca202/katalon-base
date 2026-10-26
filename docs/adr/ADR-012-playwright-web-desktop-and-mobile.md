---
id: ADR-012
status: Superseded
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, playwright, web, desktop, mobile, viewport]
supersedes: null
superseded_by: ADR-013
emits: [testing/CR-023]
---

# ADR-012: Playwright para pruebas web desktop y web mobile

## Contexto

El framework prueba aplicaciones web externas sin acceso al código fuente, y esas aplicaciones se usan tanto desde un navegador de escritorio como desde un navegador móvil. [ADR-001](ADR-001-test-runners.md) asigna a Playwright las pruebas E2E web, pero no precisa qué significa cubrir la web desktop y la web mobile. Hace falta declararlo para que quien automatice una prueba web sepa en qué proyectos corre y dónde termina el alcance de Playwright frente a Maestro ([ADR-011](ADR-011-maestro-mobile-app-runner.md)).

Drivers de la decisión:

- Playwright ofrece perfiles de dispositivo (`devices`) que emulan el viewport, el user agent y las capacidades táctiles de un móvil dentro del navegador.
- Un mismo flujo E2E se puede ejecutar en escritorio y en móvil con el mismo código y los mismos Page Objects.
- Emular un móvil dentro del navegador no equivale a probar la app nativa ni un navegador móvil real.

## Decisión

Playwright es el runner de las pruebas web en dos modalidades, cada una como proyecto de `playwright.config.ts`:

| Cobertura   | Proyecto        | Perfil de dispositivo |
| ----------- | --------------- | --------------------- |
| Web desktop | `chromium`      | `Desktop Chrome`      |
| Web mobile  | `Mobile Chrome` | `Pixel 5` (emulación) |

Las pruebas E2E se escriben una sola vez y se ejecutan en ambos proyectos. La web mobile es una emulación de viewport dentro de Chrome: no cubre apps nativas ni híbridas (que van con Maestro, [ADR-011](ADR-011-maestro-mobile-app-runner.md)) ni navegadores móviles reales.

Firefox, WebKit y Mobile Safari quedan fuera de alcance mientras estén deshabilitados en `playwright.config.ts`. Para incorporarlos se añade un proyecto con el perfil correspondiente y se actualiza este ADR.

## Alternativas consideradas

- **Solo escritorio:** no detecta problemas de diseño responsivo ni de interacción táctil.
- **Dispositivos móviles reales o granjas de dispositivos:** mayor costo y mantenimiento; la emulación cubre el comportamiento web a menor costo.
- **Un proyecto móvil por cada dispositivo:** multiplica el tiempo de ejecución sin aportar cobertura proporcional.

## Consecuencias

### Positivas

- Un mismo flujo valida escritorio y móvil sin duplicar código.
- Los scripts `test:web-desktop` y `test:web-mobile` ejecutan cada modalidad por separado.
- Es explícito qué cubre la emulación y qué queda para Maestro.

### Negativas / trade-offs

- La emulación no reproduce el comportamiento de un navegador móvil real (rendering, gestos nativos, rendimiento).
- Solo se cubre Chrome; los problemas específicos de Safari o Firefox no se detectan.
- Cada prueba E2E se ejecuta dos veces, lo que alarga la suite.

## Referencias

- [Testing Standards](../standards/testing.md): requisito `web-testing`
- [ADR-001: Runners de pruebas: Playwright y Maestro](ADR-001-test-runners.md)
- [ADR-011: Maestro como runner de pruebas de apps Android e iOS](ADR-011-maestro-mobile-app-runner.md)
- [Playwright: emulación de dispositivos](https://playwright.dev/docs/emulation)
- Superseded por [ADR-013: Katalon como runner único de pruebas](ADR-013-katalon-test-runner.md) el 2026-10-26.
