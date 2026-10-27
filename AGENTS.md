# Fuentes de contexto

Incluir estos archivos en cada conversación para obtener contexto completo sobre el proyecto:

- @.agents/MEMORY.md — Memoria persistente y reglas operativas
- @docs/adr/README.md — Decisiones de arquitectura vigentes
- @docs/standards/README.md — Estándares técnicos del proyecto
- @README.md — Descripción del proyecto

# Reglas generales

- Responder siempre en español
- Este es un proyecto de QA para testing de aplicaciones externas sin acceso al código fuente
- Katalon Studio, en su edición gratuita, es el runner único de pruebas para web, API y apps móviles, ejecutado en local ([ADR-002](docs/adr/ADR-002-katalon-test-runner.md)); no usar funciones de Enterprise ni de Runtime Engine
- El proyecto Katalon vive en `tests/katalon/`; los casos de prueba se organizan en `Test Cases/US-<id>/TC-<id> - título` (sin `:`); el criterio AC se toma de la especificación del caso ([ADR-004](docs/adr/ADR-004-katalon-allure-reporting.md))
- Cada caso que represente un Test Case de Azure DevOps empieza su nombre con `TC-<id> - `; tras ejecutar, los resultados se publican en Azure DevOps con el script del repositorio ([ADR-006](docs/adr/ADR-006-katalon-azure-devops-traceability.md))
- Los elementos de la UI se definen como Test Objects en el Object Repository; los Custom Keywords hacen una sola acción y no contienen aserciones ([ADR-008](docs/adr/ADR-008-groovy-code-style-codenarc.md))
- Los datos por ambiente van en Execution Profiles y las credenciales en variables de entorno, nunca versionadas ([ADR-007](docs/adr/ADR-007-katalon-test-data.md))
- Los casos que piden un dato a una persona usan el keyword `askHuman()`, llevan la etiqueta `human` y van en su propia Test Suite ([ADR-005](docs/adr/ADR-005-katalon-human-in-the-loop.md))
- Tras ejecutar una Test Suite en Katalon Studio, generar el reporte con `npm run allure:katalon` y publicar en Azure DevOps con `npm run ado:publish` ([ADR-004](docs/adr/ADR-004-katalon-allure-reporting.md))
- Antes de abrir un pull request: `npm run quality:check`, `npm run arch` y `npm run codenarc`. Commits con Conventional Commits ([ADR-001](docs/adr/ADR-001-conventional-commits.md))

# Stack tecnológico

## Framework Principal

- **Katalon Studio (edición gratuita)** - Diseño y ejecución local de pruebas E2E web, API y apps móviles (Groovy). Versión por definir. Sin Katalon Studio Enterprise ni Katalon Runtime Engine: las pruebas no corren en CI
- **Groovy** - Lenguaje de los scripts de los casos de prueba y de los Custom Keywords
- **Node.js 20+** - Scripts auxiliares (`scripts/`): conversión de resultados a Allure, publicación de resultados en Azure DevOps y validaciones de arquitectura

## Testing y Calidad

- **Allure 3.20.0** - Reportería con historial, alimentada por el `JUnit_Report.xml` de Katalon (config en `allurerc.mjs`)
- **CodeNarc** - Análisis estático del código Groovy (tarea de Gradle del proyecto Katalon)
- **ESLint 10.11.0** y **Prettier 3.9.8** - Lint y formato de los scripts Node y de `*.json`/`*.md`

## Integración

- **Script de publicación en Azure DevOps** - Tras cada ejecución local, crea el test run en el Test Plan y registra el resultado de cada `TC-<id>` (API REST de Azure DevOps)
- **Husky 9.1.7** - Git hooks para pre-commit

## Sistema bajo prueba

- **Tripot** (finanzas personales, web) - sistema externo; su código no vive en este repositorio
- Las URLs salen de los Execution Profiles de Katalon; las credenciales, de variables de entorno del equipo que ejecuta, y nunca se versionan
