---
id: ADR-009
status: Accepted
last_update: 2026-10-27
deciders: [Equipo de QA]
tags: [testing, katalon, object-repository, selectors, web, mobile]
supersedes: null
superseded_by: null
emits: []
---

# ADR-009: Organización del Object Repository y estrategia de selectores

## Contexto

Los elementos de la interfaz se definen como Test Objects en el Object Repository de Katalon ([ADR-008](ADR-008-groovy-code-style-codenarc.md)). Si se agrupan por historia de usuario, cada historia que pase por la misma pantalla duplica sus Test Objects, y un cambio de la interfaz obliga a corregir varias copias.

Los selectores se escriben sin acceso al código del sistema bajo prueba: no se pueden añadir atributos de prueba (`data-testid`) y una interfaz web de tipo SPA puede generar clases y estructuras inestables. El self-healing de Katalon es de la edición Enterprise, que no se usa ([ADR-002](ADR-002-katalon-test-runner.md)). Las apps nativas o híbridas se localizan con Appium, con selectores distintos a los de la web.

## Decisión

- **Organización por plataforma y pantalla**, no por historia: `Object Repository/Web/<Pantalla>/` y `Object Repository/Mobile/<Pantalla>/`. Un Test Object existe una sola vez y lo reutilizan todos los casos que pasan por esa pantalla.
- **Nombre** `<tipo>_<Nombre>` en PascalCase, con uno de estos prefijos: `btn_` (botón), `txt_` (campo de texto), `lbl_` (texto o etiqueta), `nav_` (navegación), `lnk_` (enlace), `chk_` (casilla), `sel_` (lista desplegable), `img_` (imagen).
- **Prioridad de selectores web**, de más a menos estable:
  1. `id` o `name` estables.
  2. Atributos accesibles: `aria-label`, `role` más nombre accesible, `placeholder`, `title`.
  3. Texto visible del elemento, en XPath relativo (`//button[normalize-space()='View demo']`).
  4. CSS o XPath relativo anclado a un contenedor estable.
  - No se usan XPath absolutos, índices posicionales sin ancla ni clases generadas por el framework de la SPA.
- **Prioridad de selectores móviles:** accessibility id, luego `resource-id` (Android) o `name` (iOS), y solo en último caso XPath relativo.
- **Parametrización:** un Test Object que varía por texto o posición se parametriza con variables, en lugar de duplicarse.

Pendiente de confirmar: el idioma de la interfaz que se prueba, porque los selectores por texto visible dependen de él.

## Consecuencias

### Positivas

- Un cambio de pantalla se corrige en un solo Test Object.
- Los selectores priorizan atributos que cambian menos que la estructura del DOM.
- Web y móvil quedan separados, porque sus selectores no son intercambiables.

### Negativas / trade-offs

- Los selectores por texto visible fallan si la interfaz cambia de idioma o de redacción.
- Sin self-healing, un selector roto se detecta solo al ejecutar.

## Referencias

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-008: Estilo de código Groovy con CodeNarc](ADR-008-groovy-code-style-codenarc.md)
- [Coding Style Standards](../standards/coding-style.md): requisito `locators`
