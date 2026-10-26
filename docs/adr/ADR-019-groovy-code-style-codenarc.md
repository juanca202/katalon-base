---
id: ADR-019
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [coding-style, groovy, codenarc, katalon, custom-keywords]
supersedes: null
superseded_by: null
emits: []
---

# ADR-019: Estilo de código Groovy con CodeNarc

## Contexto

El estándar de [Coding Style](../standards/coding-style.md) se escribió para el código TypeScript de las pruebas de Playwright: ESLint, Prettier y TypeScript en modo strict. Con Katalon como runner único ([ADR-013](ADR-013-katalon-test-runner.md)) el código de las pruebas pasa a ser Groovy (scripts de los casos de prueba en `Scripts/` y Custom Keywords en `Keywords/`), y esas herramientas no lo analizan. Katalon no trae un linter propio para Groovy.

El repositorio sigue teniendo código Node auxiliar (`scripts/`: conversión de resultados a Allure y validaciones de arquitectura), que mantiene sus herramientas actuales.

## Decisión

- **Groovy (`Scripts/` y `Keywords/` del proyecto Katalon):** se analiza con **CodeNarc**, ejecutado como tarea de Gradle desde el `build.gradle` del proyecto Katalon, con un `codenarc.ruleset` versionado.
- **Custom Keywords:** siguen las buenas prácticas de Katalon: una acción por keyword, sin aserciones dentro (las aserciones van en el caso de prueba), errores técnicos capturados y reportados con `KeywordUtil`, tipos de retorno explícitos cuando devuelven datos, paquetes en minúsculas con dominio invertido, clases en PascalCase y la anotación `@Keyword`.
- **Selectores:** los elementos de la interfaz se definen como Test Objects en el Object Repository, no como selectores escritos dentro de los scripts.
- **Código Node auxiliar (`scripts/`):** mantiene ESLint y Prettier.

## Consecuencias

### Positivas

- El código de las pruebas vuelve a tener una compuerta de estilo automática.
- Las reglas de los Custom Keywords coinciden con las que Katalon recomienda.
- El Object Repository centraliza los selectores, que es lo que antes resolvían los Page Objects.

### Negativas / trade-offs

- CodeNarc añade Gradle y Java al flujo de calidad.
- El `codenarc.ruleset` es propio y hay que mantenerlo.
- Conviven dos juegos de herramientas de estilo: CodeNarc para Groovy y ESLint/Prettier para los scripts Node.

## Referencias

- [ADR-013: Katalon como runner único de pruebas](ADR-013-katalon-test-runner.md)
- [Coding Style Standards](../standards/coding-style.md)
- [Katalon: buenas prácticas de Custom Keywords](https://docs.katalon.com/katalon-studio/keywords/custom-keywords/custom-keywords-best-practices)
- [Katalon: análisis estático con CodeNarc](https://katalon.com/resources-center/blog/static-code-analysis-with-katalon)
- [CodeNarc](https://codenarc.org/)
