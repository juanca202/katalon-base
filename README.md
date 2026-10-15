# Proyecto Base de QA

Este es un framework de pruebas automatizadas diseñado para realizar testing de aplicaciones web y APIs REST sin acceso al código fuente. Proporciona una base sólida para implementar pruebas E2E y API testing.

El framework está construido con Playwright + TypeScript y sigue las mejores prácticas de la industria para testing de aplicaciones externas, incluyendo patrones de Page Object Model, configuración multi-ambiente y reportería avanzada con Allure.

## Características principales

- 🎭 **Playwright + TypeScript**: Framework moderno para testing E2E y API
- 📊 **Allure Reports**: Reportería avanzada con categorización de fallos, historial y tendencias
- 🌐 **Multi-browser**: Soporte para Chromium, Firefox, Safari y móviles
- 🔧 **Configuración flexible**: Variables por ambiente y configuración modular
- 🎯 **Page Object Model**: Estructura mantenible y reutilizable
- 🧪 **Mocks HTTP con MSW**: Simulación de APIs con Mock Service Worker
- 🔎 **Evidencias de ejecución**: Trace de Playwright en E2E y evidencia estructurada en API
- 🔗 **Trazabilidad con Azure DevOps**: Cada prueba se identifica con su Test Case (`TC-<id>`)
- 🏛️ **Arquitectura documentada y verificable**: ADRs, estándares y validaciones automáticas (`npm run arch`)
- 📝 **Plantillas de reportes de calidad**: Formatos DTG para informes de pruebas
- 🚀 **CI/CD Ready**: Pipeline de Azure Pipelines incluido

## Requisitos previos

- Node.js 20 o superior
- npm

## Estructura del proyecto

```
├── src/                    # Código fuente del framework
│   ├── pages/             # Page Objects (BasePage y páginas derivadas)
│   ├── fixtures/          # Datos de prueba
│   └── mocks/             # Handlers y worker de MSW
├── tests/                 # Test suites, una carpeta por motor de pruebas
│   └── playwright/        # Pruebas con Playwright
│       ├── e2e/          # Pruebas End-to-End
│       ├── api/          # Pruebas de API
│       ├── setup/        # Global setup y teardown
│       └── utils/        # Utilidades de testing
├── public/                # Service worker de MSW (mockServiceWorker.js)
├── scripts/arch/          # Validaciones de arquitectura (fitness functions)
├── docs/                  # Documentación técnica
│   ├── adr/              # Architectural Decision Records
│   ├── standards/        # Estándares técnicos
│   ├── templates/        # Plantillas de reportes de calidad (DTG018-DTG063)
│   ├── formats/          # Formatos originales (xlsx/pdf) de los reportes
│   └── specs/            # Especificaciones de trabajo (SDD DevKit)
├── playwright.config.ts   # Configuración de Playwright (proyectos, reporters, evidencias)
├── allurerc.mjs           # Configuración de Allure (historial y reporte)
├── azure-pipelines.yml    # Pipeline de CI en Azure DevOps
├── .env.example           # Plantilla de variables de ambiente
├── AGENTS.md              # Reglas del proyecto y stack para agentes de IA
├── .agents/               # Memoria persistente del proyecto
├── .kiro/                 # Steering y skills de Kiro (p. ej. generate-report)
├── .sdd-devkit/           # Configuración de SDD DevKit
└── .husky/                # Git hooks (pre-commit con lint-staged)
```

## Primeros pasos

1. **Instalar dependencias**:

   ```bash
   npm install
   npm run install:browsers
   ```

2. **Configurar variables de ambiente**:

   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

   Variables principales: `BASE_URL`, `API_BASE_URL`, `TEST_ENV`, `START_LOCAL_SERVER`, credenciales de prueba (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`), `HEADLESS`, `BROWSER`, `TIMEOUT`. Los datos que dependen del ambiente y las credenciales no se versionan (ver [ADR-006](docs/adr/ADR-006-test-data-strategy.md)).

3. **Ejecutar pruebas de ejemplo**:

   ```bash
   npm test                    # Todas las pruebas (genera el reporte Allure)
   npm run test:e2e           # Solo E2E
   npm run test:api           # Solo API
   ```

4. **Ver reportes**:
   ```bash
   npm run allure:serve       # Genera el reporte Allure y lo abre en el navegador
   npm run test:report        # Reporte HTML de Playwright
   ```

## Scripts disponibles

### Pruebas

- `npm test` - Ejecutar todas las pruebas y generar el reporte Allure (`allure-report/`)
- `npm run test:e2e` - Solo pruebas E2E (con reporte Allure)
- `npm run test:api` - Solo pruebas de API (con reporte Allure)
- `npm run test:desktop` - Web de escritorio (proyecto `chromium`)
- `npm run test:web-mobile` - Web en viewport móvil (proyecto `Mobile Chrome`)
- `npm run test:mobile` - Apps nativas o híbridas Android e iOS con Maestro (`tests/maestro/`): resultados JUnit a Allure y evidencias en `test-results/maestro/`
- `npm run test:all` - Playwright (desktop, web-mobile y API) y Maestro en una sola ejecución, con un único reporte Allure
- `npm run test:human` - Solo pruebas Human-in-the-Loop (`@human`): Chromium y un worker; browser visible solo con `@visible`
- `npm run test:headed` - Ejecutar con browser visible
- `npm run test:ui` - Interfaz interactiva de Playwright
- `npm run test:debug` - Modo debug
- `npm run test:report` - Reporte HTML de Playwright

### Reportes

- `npm run allure:generate` - Generar reporte Allure desde `allure-results/`
- `npm run allure:serve` - Generar el reporte Allure y abrirlo en el navegador
- `npm run allure:open` - Abrir un reporte Allure ya generado

### Calidad

- `npm run lint` / `npm run lint:fix` - Ejecutar ESLint (con o sin autocorrección)
- `npm run format` / `npm run format:check` - Formatear o verificar el formato con Prettier
- `npm run build` - Compilar TypeScript
- `npm run quality:check` - Lint, verificación de formato y build
- `npm run arch` - Validaciones de arquitectura contra los estándares de `docs/standards/`

### Mantenimiento

- `npm run install:browsers` - Instalar los browsers de Playwright
- `npm run install:deps` - Instalar las dependencias del sistema de los browsers
- `npm run clean` - Eliminar `dist`, `allure-results`, `allure-report` y `test-results`

## Proyectos de Playwright

Definidos en [playwright.config.ts](playwright.config.ts): `chromium` (Chrome de escritorio), `Mobile Chrome` (Pixel 5) y `api-tests` (pruebas de API con `API_BASE_URL`). Para correr uno solo: `npx playwright test --project=chromium`. Firefox, WebKit y Mobile Safari están deshabilitados de momento. Las apps nativas o híbridas de Android e iOS se prueban con Maestro, en su propia carpeta, `tests/maestro/` ([ADR-011](docs/adr/ADR-011-maestro-mobile-app-runner.md)).

## Convenciones de pruebas

- **Page Object Model**: las páginas son clases `*Page.ts` que extienden `BasePage` ([ADR-002](docs/adr/ADR-002-page-object-model-pattern.md)).
- **Trazabilidad**: el título de cada prueba empieza con el identificador de su Test Case de Azure DevOps, con un solo `TC-<id>` por prueba (por ejemplo `TC-1234: crear usuario devuelve 201`). ESLint lo valida ([ADR-008](docs/adr/ADR-008-azure-devops-test-case-traceability.md)).
- **Historia → Criterio → Caso de prueba**: las pruebas se agrupan con `acceptanceCriterion()` de `src/helpers/traceability.ts`, que anida `US-XXX` y `AC-XXX` y deja el `TC-<id>` en el título de cada prueba. En Allure, la historia aparece como Feature y el criterio como Story (pestaña Behaviors).

  ```ts
  acceptanceCriterion(
    'US-001: Acceso al portal',
    'AC-001: Autenticación y acceso al portal',
    () => {
      test('TC-33801: credenciales inválidas muestran el mismo error', async ({
        page,
      }) => {
        // ...
      });
    }
  );
  ```

- **Tipos de prueba**: 🤖 _Fully Automated_ (sin intervención humana) y 👤 _Human-in-the-Loop_ (flujo automatizado que requiere input manual, como un OTP). En los Test Cases Human-in-the-Loop se especifica qué input se ingresa manualmente. Las pruebas que lo automatizan usan `askHuman()` (`src/helpers/human-intervention.ts`), llevan la etiqueta `@human` (y `@visible` si la persona debe interactuar con la página, como en un CAPTCHA), no corren en `npm test` y se ejecutan con `npm run test:human` ([ADR-010](docs/adr/ADR-010-human-in-the-loop-tests.md)).
- **API**: las pruebas usan el `APIRequestContext` de Playwright, tanto para REST como para GraphQL ([ADR-005](docs/adr/ADR-005-playwright-api-request-context.md)).
- **Mocks**: las APIs HTTP se simulan con MSW desde `src/mocks/` ([ADR-003](docs/adr/ADR-003-msw-http-mocks.md)).
- **Evidencias**: el trace se captura en todas las ejecuciones E2E (`trace: 'on'`); screenshots y videos solo cuando una prueba los requiere ([ADR-007](docs/adr/ADR-007-execution-evidence.md)).

El detalle completo está en los [estándares](docs/standards/README.md).

## Reportes de ejecución

- **Allure** (`allurerc.mjs`): el reporte se genera con `allure run` al terminar `npm test`. Guarda el historial en `.allure/history.jsonl`, lo que habilita tendencias y detección de tests inestables. Las categorías de fallos están en `playwright.config.ts`.
- **Playwright HTML**: `npm run test:report`.
- **JUnit**: `test-results/junit.xml`, en formato legible por máquina para publicarlo en Azure DevOps.
- **Evidencias**: traces y demás artefactos en `test-results/`.

## Integración continua

[azure-pipelines.yml](azure-pipelines.yml) instala dependencias y browsers, ejecuta `quality:check` y las pruebas, y publica los resultados JUnit, el reporte Allure y las evidencias como artefactos. El historial de Allure se conserva entre ejecuciones con `Cache@2`. Debes definir las variables `BASE_URL` y `API_BASE_URL` en el pipeline.

## Calidad y flujo de trabajo

- **Pre-commit**: Husky ejecuta lint-staged (ESLint y Prettier sobre `*.{ts,js}`, Prettier sobre `*.{json,md}`).
- **Commits**: se siguen Conventional Commits ([ADR-004](docs/adr/ADR-004-conventional-commits.md)).
- **Validaciones de arquitectura**: `npm run arch` comprueba que el código cumple los criterios verificables de los estándares ([scripts/arch/](scripts/arch/README.md)).

## Documentación

- [Decisiones de arquitectura (ADR)](docs/adr/README.md)
- [Estándares técnicos](docs/standards/README.md)
- [AGENTS.md](AGENTS.md): reglas del proyecto y stack tecnológico
- [Plantillas de reportes de calidad](docs/templates/): informe final de pruebas (DTG045), matriz de incidencias (DTG018), análisis de pruebas (DTG019), matriz de eventos (DTG020), pantallas de soporte (DTG022) y check list de calidad (DTG063). La skill `generate-report` de Kiro las usa para generar reportes en `docs/reports/`.
