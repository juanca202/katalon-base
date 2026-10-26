---
id: ADR-011
status: Accepted
last_update: 2026-10-19
deciders: [Equipo de QA]
tags: [testing, maestro, mobile, android, ios]
supersedes: null
superseded_by: null
emits: [testing/CR-019, testing/CR-020]
---

# ADR-011: Maestro como runner de pruebas de apps Android e iOS

## Contexto

El reparto de runners está en [ADR-001](ADR-001-test-runners.md). Este ADR detalla el de las apps nativas o híbridas de Android e iOS, que sin acceso al código exige un runner de caja negra que:

- Interactúe con la app mediante la UI accesible, sin instrumentarla ni recompilarla.
- Use una misma definición de flujo para Android e iOS.
- Tenga una barrera de entrada baja para QA, con flujos declarativos y resultados exportables a un formato legible por máquina.

## Decisión

Las pruebas de aplicaciones móviles nativas o híbridas (Android e iOS) usan **Maestro** como runner. Los flujos se escriben como archivos YAML declarativos y viven en `tests/maestro/`. Los resultados de Maestro se exportan en formato JUnit para integrarse con la publicación de resultados y la trazabilidad por Test Case del pipeline ([ADR-008](ADR-008-azure-devops-test-case-traceability.md)).

## Alternativas consideradas

- Appium: soporta muchos lenguajes y plataformas, pero exige servidor, drivers y código por plataforma; mayor costo de configuración y mantenimiento para un equipo de QA.
- Detox: pensado para React Native con acceso al proyecto, lo que no aplica a caja negra.
- Espresso / XCUITest: requieren acceso al código y un runner por plataforma, sin flujo compartido.
- Playwright con emulación móvil: no prueba la app nativa.

## Consecuencias

### Positivas

- Un único flujo YAML sirve para Android e iOS en la mayoría de los casos.
- Flujos legibles por QA sin escribir código.
- Separación clara entre motores: `tests/playwright/` y `tests/maestro/`.

### Negativas / trade-offs

- Un segundo motor que mantener: CLI de Maestro, emuladores o simuladores y su instalación en CI (iOS requiere agente macOS).
- No comparte Page Objects, Allure ni el helper de trazabilidad de Playwright; la reportería y la trazabilidad se resuelven vía JUnit.
- Menor control programático que un framework con código para lógica compleja.
- El driver de Maestro a veces no arranca y todos los flujos fallan sin ejecutarse (`DeviceServerDiedException`); `scripts/maestro/run.mjs` reintenta una vez (`MAESTRO_RETRIES`).
- Si la app es un TWA, su contenido web vive en el proceso de Chrome: `stopApp` de la app no reinicia la sesión y hay que detener también `com.android.chrome` para partir de cero.
- El emulador (`npm run emulator:start`) usa una imagen de Google APIs sin Play Store: las apps que verifican la licencia de Google Play al abrir no corren en él y requieren un build de QA sin esa verificación o un dispositivo físico.

## Referencias

- [Testing Standards](../standards/testing.md): requisito `mobile-app-testing`
- [ADR-001: Runners de pruebas: Playwright y Maestro](ADR-001-test-runners.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md)
- [Documentación de Maestro](https://docs.maestro.dev)
