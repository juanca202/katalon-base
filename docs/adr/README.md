# Registros de Decisiones de Arquitectura

Este directorio contiene las decisiones de arquitectura importantes del proyecto de QA, documentadas como ADRs para mantener un registro histórico y justificación de las elecciones técnicas.

<!-- arch-manage añade aquí una línea por ADR creado: `- [ADR-XXX: Título](ADR-XXX-slug.md)`. No reordenar ni eliminar entradas manualmente. -->

- [ADR-001: Conventional Commits con commitlint y Husky](ADR-001-conventional-commits.md)
- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-003: Evidencias de ejecución con Katalon](ADR-003-katalon-execution-evidence.md)
- [ADR-004: Reportería con Allure a partir de los resultados de Katalon](ADR-004-katalon-allure-reporting.md)
- [ADR-005: Pruebas Human-in-the-Loop con Katalon](ADR-005-katalon-human-in-the-loop.md)
- [ADR-006: Trazabilidad con Test Cases de Azure DevOps desde los resultados de Katalon](ADR-006-katalon-azure-devops-traceability.md)
- [ADR-007: Datos de prueba con Katalon](ADR-007-katalon-test-data.md)
- [ADR-008: Estilo de código Groovy con CodeNarc](ADR-008-groovy-code-style-codenarc.md)
- [ADR-009: Organización del Object Repository y estrategia de selectores](ADR-009-katalon-object-repository-selectors.md)
- [ADR-010: Reutilización de flujos con Custom Keywords y casos comunes](ADR-010-katalon-reusable-flows.md)
- [ADR-011: Ambientes de ejecución y política de pruebas en producción](ADR-011-test-environments.md)
- [ADR-012: Pruebas de API REST y GraphQL con Katalon](ADR-012-katalon-api-testing.md)
- [ADR-013: Regresión visual con capturas y línea base versionada](ADR-013-visual-regression.md)
- [ADR-014: Pruebas contra ambientes reales y simulación de red puntual](ADR-014-mocks-and-isolation.md)

## Formato de ADR

Cada ADR lleva frontmatter (`id`, `status`, `last_update`, `deciders`, `tags`, `supersedes`, `superseded_by`, `emits`) y las secciones `Contexto`, `Decisión`, `Consecuencias` y `Referencias`. `Alternativas consideradas` solo aparece si se evaluaron opciones.

## Criterios de documentación

Se documentan como ADR las decisiones que:

- Afectan la arquitectura del framework de testing
- Tienen impacto en múltiples componentes
- Requieren justificación técnica para el equipo
- Pueden cambiar en el futuro y necesitan contexto histórico
