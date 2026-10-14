# Registros de Decisiones de Arquitectura

Este directorio contiene las decisiones de arquitectura importantes del proyecto de QA, documentadas como ADRs para mantener un registro histórico y justificación de las elecciones técnicas.

<!-- arch-manage añade aquí una línea por ADR creado: `- [ADR-XXX: Título](ADR-XXX-slug.md)`. No reordenar ni eliminar entradas manualmente. -->

- [ADR-001: Playwright como Framework Principal de Testing](ADR-001-playwright-as-testing-framework.md)
- [ADR-002: Page Object Model como Patrón de Diseño](ADR-002-page-object-model-pattern.md)
- [ADR-003: Mock Service Worker para mocks de APIs HTTP](ADR-003-msw-http-mocks.md)
- [ADR-004: Conventional Commits con commitlint y Husky](ADR-004-conventional-commits.md)
- [ADR-005: APIRequestContext de Playwright para pruebas REST y GraphQL](ADR-005-playwright-api-request-context.md)
- [ADR-006: Estrategia de datos de prueba](ADR-006-test-data-strategy.md)
- [ADR-007: Evidencias y artefactos de ejecución](ADR-007-execution-evidence.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md)
- [ADR-009: Allure como capa de reportería y jerarquía Historia → Criterio → Caso de prueba](ADR-009-allure-reporting-and-traceability-hierarchy.md)
- [ADR-010: Tipos de prueba Fully Automated y Human-in-the-Loop](ADR-010-human-in-the-loop-tests.md)
- [ADR-011: Maestro como runner de pruebas de apps Android e iOS](ADR-011-maestro-mobile-app-runner.md)

## Formato de ADR

Cada ADR lleva frontmatter (`id`, `status`, `last_update`, `deciders`, `tags`, `supersedes`, `superseded_by`, `emits`) y las secciones `Contexto`, `Decisión`, `Consecuencias` y `Referencias`. `Alternativas consideradas` solo aparece si se evaluaron opciones.

## Criterios de documentación

Se documentan como ADR las decisiones que:

- Afectan la arquitectura del framework de testing
- Tienen impacto en múltiples componentes
- Requieren justificación técnica para el equipo
- Pueden cambiar en el futuro y necesitan contexto histórico
