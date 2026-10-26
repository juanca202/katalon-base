# Fuentes de contexto

Incluir estos archivos en cada conversación para obtener contexto completo sobre el proyecto:

- @.agents/MEMORY.md — Memoria persistente y reglas operativas
- @docs/adr/README.md — Decisiones de arquitectura vigentes
- @docs/standards/README.md — Estándares técnicos del proyecto
- @README.md — Descripción del proyecto

# Reglas generales

- Este es un proyecto de QA para testing de aplicaciones externas sin acceso al código fuente
- Katalon Studio, en su edición gratuita, es el runner único de pruebas para web, API y apps móviles, ejecutado en local ([ADR-013](docs/adr/ADR-013-katalon-test-runner.md)); no usar funciones de Enterprise ni de Runtime Engine; no añadir pruebas nuevas con Playwright ni Maestro. Las existentes en `tests/playwright/` y `tests/maestro/` son legado en migración
- El proyecto Katalon vive en `tests/katalon/`; los casos de prueba se organizan en `Test Cases/US-<id>: …/AC-<id>: …/TC-<id>: …` ([ADR-015](docs/adr/ADR-015-katalon-allure-reporting.md))
- Cada caso que represente un Test Case de Azure DevOps empieza su nombre con `TC-<id>: `; tras ejecutar, los resultados se publican en Azure DevOps con el script del repositorio ([ADR-017](docs/adr/ADR-017-katalon-azure-devops-traceability.md))
- Los elementos de la UI se definen como Test Objects en el Object Repository; los Custom Keywords hacen una sola acción y no contienen aserciones ([ADR-019](docs/adr/ADR-019-groovy-code-style-codenarc.md))
- Los datos por ambiente van en Execution Profiles y las credenciales en variables de entorno, nunca versionadas ([ADR-018](docs/adr/ADR-018-katalon-test-data.md))
- Mantener reportes claros usando Allure, alimentado por el JUnit de Katalon ([ADR-015](docs/adr/ADR-015-katalon-allure-reporting.md))

# Stack tecnológico

## Framework Principal

- **Katalon Studio (edición gratuita)** - Diseño y ejecución local de pruebas E2E web, API y apps móviles (Groovy). Versión por definir. Sin Katalon Studio Enterprise ni Katalon Runtime Engine: las pruebas no corren en CI
- **Groovy** - Lenguaje de los scripts de los casos de prueba y de los Custom Keywords
- **Node.js 20+** - Scripts auxiliares (`scripts/`): conversión de resultados a Allure, publicación de resultados en Azure DevOps y validaciones de arquitectura

## Testing y Calidad

- **Allure 3.20.0** - Reportería con historial, alimentada por el `JUnit_Report.xml` de Katalon (config en `allurerc.mjs`)
- **CodeNarc** - Análisis estático del código Groovy (tarea de Gradle del proyecto Katalon)
- **ESLint 10.11.0** y **Prettier 3.9.8** - Lint y formato de los scripts Node y de `*.json`/`*.md`

## Integración y CI/CD

- **Azure Pipelines** - Ejecuta las validaciones estáticas (CodeNarc, `npm run arch`, lint); no ejecuta las pruebas
- **Script de publicación en Azure DevOps** - Tras cada ejecución local, crea el test run en el Test Plan y registra el resultado de cada `TC-<id>` (API REST de Azure DevOps)
- **Husky 9.1.7** - Git hooks para pre-commit

## Sistema bajo prueba

- **Tripot** (finanzas personales, web) - sistema externo; su código no vive en este repositorio
- Las URLs salen de los Execution Profiles de Katalon; las credenciales, de variables de entorno del equipo que ejecuta, y nunca se versionan

## Legado en migración

- **Playwright 1.63.0 + TypeScript 6.0.3** (`tests/playwright/`, `playwright.config.ts`) y **Maestro** (`tests/maestro/`): siguen ejecutándose hasta migrar sus pruebas a Katalon
