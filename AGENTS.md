# Fuentes de contexto

Incluir estos archivos en cada conversación para obtener contexto completo sobre el proyecto:

- @.agents/MEMORY.md — Memoria persistente y reglas operativas
- @docs/adr/README.md — Decisiones de arquitectura vigentes
- @docs/standards/README.md — Estándares técnicos del proyecto
- @README.md — Descripción del proyecto

# Reglas generales

- Este es un proyecto de QA para testing de aplicaciones externas sin acceso al código fuente
- Runners disponibles ([ADR-001](docs/adr/ADR-001-test-runners.md)): Playwright + TypeScript para E2E web y API testing (`tests/playwright/`), y Maestro para apps nativas o híbridas Android e iOS (`tests/maestro/`)
- Seguir patrones de Page Object Model para estructurar las pruebas
- Mantener reportes claros usando Allure para documentación de resultados
- Configurar pruebas para múltiples browsers y viewports
- Usar datos de prueba parametrizados y configurables por ambiente

# Stack tecnológico

## Framework Principal

- **Playwright 1.63.0** - Runner de pruebas E2E web y API
- **Maestro** - Runner de pruebas de apps nativas o híbridas Android e iOS
- **TypeScript 6.0.3** - Lenguaje principal con type safety
- **Node.js 20+** - Runtime environment

## Testing y Calidad

- **Allure 3.20.0** - Reportería avanzada con categorización (CLI `allure` + `allure-playwright` 3.13.0, config en `allurerc.mjs`)
- **ESLint 10.11.0** - Linting con configuración TypeScript
- **Prettier 3.9.8** - Code formatting

## Integración y CI/CD

- **Husky 9.1.7** - Git hooks para pre-commit
- **dotenv 18.0.3** - Gestión de variables de ambiente

## Browsers y Devices

- **Chromium, Firefox, WebKit** - Testing multi-browser
- **Mobile viewports** - Chrome Mobile, Safari Mobile
- **Headless/Headed** - Configurable por ambiente

## Arquitectura

- **Page Object Model** - Patrón de diseño para mantener tests
- **Multi-environment** - dev, staging, production
- **Parallel execution** - Tests independientes en paralelo
