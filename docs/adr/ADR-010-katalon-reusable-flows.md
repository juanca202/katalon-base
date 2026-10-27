---
id: ADR-010
status: Draft
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, katalon, custom-keywords, reuse, groovy]
supersedes: null
superseded_by: null
emits: []
---

# ADR-010: Reutilización de flujos con Custom Keywords y casos comunes

## Contexto

Muchos casos de prueba repiten los mismos pasos: abrir la aplicación, iniciar sesión, navegar a una sección. Si cada caso los escribe completos, un cambio en uno de esos flujos obliga a corregir todos los casos que lo copian.

Katalon ofrece dos mecanismos de reutilización: los Custom Keywords (clases Groovy en `Keywords/`) y la llamada a otro caso de prueba (`WebUI.callTestCase`). [ADR-008](ADR-008-groovy-code-style-codenarc.md) fija que un Custom Keyword hace una sola acción y no contiene aserciones.

## Decisión

- **Custom Keywords por pantalla** para las acciones de negocio sobre una pantalla (`Keywords/<app>/web/<Pantalla>.groovy`, `Keywords/<app>/mobile/<Pantalla>.groovy`): por ejemplo `AuthScreen.login(user)` o `TransactionsScreen.addExpense(amount)`. Cada método hace una sola acción, sin aserciones, usando los Test Objects de su pantalla ([ADR-009](ADR-009-katalon-object-repository-selectors.md)).
- **Keywords técnicos** comunes en `Keywords/<app>/common/`: abrir y cerrar el navegador o la app con la configuración del perfil, leer credenciales de variables de entorno ([ADR-007](ADR-007-katalon-test-data.md)), enviar peticiones API con evidencia ([ADR-003](ADR-003-katalon-execution-evidence.md)) y `askHuman()` ([ADR-005](ADR-005-katalon-human-in-the-loop.md)).
- **Los casos de prueba** (`Test Cases/US-<id>/TC-<id> - …`) componen keywords y contienen las verificaciones. No se usa `callTestCase` para reutilizar flujos, porque mezcla pasos y verificaciones de otro caso y oculta el flujo en el reporte.
- **Apertura y cierre del navegador o la app** en Test Listeners (`@BeforeTestCase` y `@AfterTestCase`), de modo que ningún caso deje una sesión abierta si falla.

## Consecuencias

### Positivas

- Un cambio de flujo se corrige en un solo keyword.
- Los scripts de los casos se leen como pasos de negocio seguidos de verificaciones.
- El cierre en un Test Listener evita navegadores huérfanos tras un fallo.

### Negativas / trade-offs

- Las clases de keywords por pantalla duplican parte de la estructura del Object Repository.
- Un keyword mal diseñado con varias acciones viola ADR-008 y es difícil de reutilizar.

## Referencias

- [ADR-003: Evidencias de ejecución con Katalon](ADR-003-katalon-execution-evidence.md)
- [ADR-005: Pruebas Human-in-the-Loop con Katalon](ADR-005-katalon-human-in-the-loop.md)
- [ADR-007: Datos de prueba con Katalon](ADR-007-katalon-test-data.md)
- [ADR-008: Estilo de código Groovy con CodeNarc](ADR-008-groovy-code-style-codenarc.md)
- [ADR-009: Organización del Object Repository y estrategia de selectores](ADR-009-katalon-object-repository-selectors.md)
- [Katalon: buenas prácticas de Custom Keywords](https://docs.katalon.com/katalon-studio/keywords/custom-keywords/custom-keywords-best-practices)
