---
id: ADR-002
status: Accepted
last_update: 2026-09-22
deciders: [Equipo de QA]
tags: [pom, testing, e2e]
supersedes: null
superseded_by: null
emits: []
---

# ADR-002: Page Object Model como Patrón de Diseño

## Contexto

Necesitamos establecer un patrón de diseño consistente para estructurar las pruebas E2E que sea mantenible, escalable y facilite la reutilización de código. Las aplicaciones que probamos son externas y sus interfaces pueden cambiar frecuentemente.

Drivers de la elección:

- Un cambio de UI se actualiza en la page class, no en cada prueba.
- Los métodos de interacción se reutilizan entre pruebas.
- Las pruebas se escriben en el lenguaje del dominio de negocio.
- La lógica de UI queda separada de la lógica de la prueba.
- Agregar páginas y funcionalidades sigue la misma estructura.
- La estructura es familiar para quien se incorpora al equipo.

## Decisión

Adoptamos el **Page Object Model (POM)** como patrón de diseño principal para estructurar nuestras pruebas automatizadas.

## Alternativas consideradas

- **Tests lineales**: difíciles de mantener, con código duplicado.
- **App Actions**: más complejo de implementar y de entender.
- **Screenplay Pattern**: overhead innecesario para este caso de uso.

## Consecuencias

### Positivas

- El código de las pruebas es más limpio y legible.
- El mantenimiento es más local cuando cambian interfaces externas.
- Mejora la colaboración entre roles técnicos y no técnicos.
- Reduce la duplicación de código entre pruebas.
- Facilita wait strategies consistentes.

### Negativas / trade-offs

- Overhead inicial al crear los page objects.
- Puede llevar a over-engineering en casos simples.
- Requiere disciplina del equipo para mantener la estructura.
- Curva de aprendizaje para quien no conoce el patrón.
- Hace falta convenir nombres y estructura de selectores y métodos.

## Referencias

- [ADR-001: Runners de pruebas: Playwright y Maestro](ADR-001-test-runners.md)
- [Estándar de Testing](../standards/testing.md)
