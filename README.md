# test-katalon

Proyecto base de pruebas automatizadas con Katalon Studio para sistemas externos. El código del sistema bajo prueba no vive en este repositorio: las pruebas se ejecutan contra la aplicación desplegada.

Katalon Studio, en su edición gratuita, es el runner único de pruebas para web, API y apps móviles ([ADR-002](docs/adr/ADR-002-katalon-test-runner.md)). Las pruebas se ejecutan en local desde Katalon Studio, y sus resultados se publican en Allure y en los Test Cases de Azure DevOps.

## Características principales

- 🧪 **Katalon Studio**: E2E web, API y apps nativas o híbridas Android e iOS, con Object Repository y Custom Keywords en Groovy
- 📊 **Allure Reports**: historial, tendencias y árbol Tipo → Plataforma → Historia → Criterio → Caso de prueba
- 🔎 **Evidencias de ejecución**: log paso a paso, capturas y video en web ([ADR-003](docs/adr/ADR-003-katalon-execution-evidence.md))
- 🔗 **Trazabilidad con Azure DevOps**: cada caso se identifica con su Test Case (`TC-<id>`)
- 🏛️ **Arquitectura documentada y verificable**: ADRs, estándares y validaciones automáticas (`npm run arch`)
- 📝 **Plantillas de reportes de calidad**: formatos DTG para informes de pruebas

## Requisitos previos

- [Katalon Studio](https://katalon.com/download) (edición gratuita)
- Node.js 20 o superior y npm (scripts auxiliares y reporte de Allure)
- Gradle y Java 17 o superior (análisis con CodeNarc)
- [ffmpeg](https://ffmpeg.org/) (opcional, `brew install ffmpeg`): convierte a MP4 los videos AVI de Katalon para que se reproduzcan en el reporte de Allure; sin ffmpeg se adjunta el AVI original
- Para apps móviles: Android SDK con `ANDROID_HOME` (emulador) o un dispositivo conectado

## Estructura del proyecto

```
├── tests/
│   └── katalon/            # Proyecto Katalon Studio
│       ├── Test Cases/    # Casos por historia: US-<id>/TC-<id> - título
│       ├── Scripts/       # Scripts Groovy de los casos
│       ├── Object Repository/ # Test Objects
│       ├── Test Suites/   # Suites por historia
│       ├── Keywords/      # Custom Keywords
│       ├── Test Listeners/ # Listeners de ejecución
│       ├── Profiles/      # Execution Profiles por ambiente
│       └── Reports/       # Resultados de ejecución (no versionado)
├── scripts/
│   ├── katalon/           # Conversión a Allure y publicación en Azure DevOps
│   ├── arch/              # Validaciones de arquitectura (fitness functions)
│   └── emulator/          # Emulador Android para pruebas móviles
├── docs/
│   ├── adr/              # Architectural Decision Records
│   ├── standards/        # Estándares técnicos
│   ├── templates/        # Plantillas de reportes de calidad (DTG018-DTG063)
│   ├── formats/          # Formatos originales (xlsx/pdf) de los reportes
│   └── specs/            # Especificaciones de trabajo (SDD DevKit)
├── allurerc.mjs           # Configuración de Allure (historial y reporte)
├── .env.example           # Variables de entorno (credenciales, PAT de Azure DevOps)
├── .mcp.json              # Servidores MCP para agentes (Katalon Studio y Azure DevOps)
├── AGENTS.md              # Reglas del proyecto y stack para agentes de IA
├── .agents/               # Memoria persistente y skills del proyecto (p. ej. generate-report)
├── .kiro/                 # Memoria y skills de Kiro (p. ej. generate-report)
├── .sdd-devkit/           # Configuración de SDD DevKit
└── .husky/                # Git hooks (pre-commit con lint-staged)
```

## Primeros pasos

1. **Instalar dependencias de los scripts**:

   ```bash
   npm install
   ```

2. **Configurar las variables de entorno** con las credenciales de prueba ([ADR-007](docs/adr/ADR-007-katalon-test-data.md)):

   ```bash
   cp .env.example .env
   # Completar los valores y exportarlos antes de abrir Katalon Studio
   ```

   Las URLs del sistema bajo prueba están en los Execution Profiles (`tests/katalon/Profiles/`).

3. **Abrir el proyecto** `tests/katalon/` en Katalon Studio. En Project > Settings > Execution, activar la grabación de video con **Screen Recorder** para todos los casos y la captura automática al fallar.

4. **Ejecutar una Test Suite** desde Katalon Studio (por ejemplo `Test Suites/US-<id>/TS - US-<id> <título>`).

5. **Generar y abrir el reporte de Allure**:

   ```bash
   npm run allure:katalon
   ```

6. **Publicar los resultados en Azure DevOps**:

   ```bash
   npm run ado:publish
   ```

## Scripts disponibles

- `npm run allure:katalon` - Convierte la última ejecución de Katalon (`tests/katalon/Reports/`) y abre el reporte de Allure
- `npm run ado:publish` - Publica la última ejecución en el Test Plan de Azure DevOps (`ADO_PAT` y `ADO_TEST_PLAN_ID`; `-- --dry-run` para revisar sin publicar)
- `npm run allure:generate` / `npm run allure:serve` / `npm run allure:open` - Generar, generar y abrir, o abrir el reporte de Allure
- `npm run lint` / `npm run lint:fix` - ESLint sobre `scripts/`
- `npm run format` / `npm run format:check` - Prettier sobre `scripts/`
- `npm run quality:check` - Lint y verificación de formato
- `npm run codenarc` - Análisis estático del código Groovy del proyecto Katalon con CodeNarc (requiere Gradle y Java)
- `npm run arch` - Validaciones de arquitectura contra los estándares de `docs/standards/`
- `npm run emulator:start` / `npm run emulator:start:play` / `npm run emulator:stop` - Emulador Android `qa-pixel-35` (la variante `play` incluye Google Play Store)
- `npm run clean` - Eliminar `allure-results` y `allure-report`

## Convenciones de pruebas

- **Organización**: los casos viven en `Test Cases/US-<id>/` con el nombre `TC-<id> - título`; su criterio de aceptación sale de la especificación del caso en `docs/specs/` ([ADR-004](docs/adr/ADR-004-katalon-allure-reporting.md)).
- **Trazabilidad**: el nombre de cada caso empieza con el ID de su Test Case de Azure DevOps, uno por caso ([ADR-006](docs/adr/ADR-006-katalon-azure-devops-traceability.md)).
- **Test Objects y Custom Keywords**: los selectores viven en el Object Repository; cada Custom Keyword hace una sola acción y no contiene aserciones ([ADR-008](docs/adr/ADR-008-groovy-code-style-codenarc.md)).
- **Datos de prueba**: Execution Profiles por ambiente, Data Files sobre CSV y credenciales en variables de entorno ([ADR-007](docs/adr/ADR-007-katalon-test-data.md)).
- **Tipos de prueba**: 🤖 _Fully Automated_ y 👤 _Human-in-the-Loop_. Los casos que piden un dato a una persona usan el Custom Keyword `askHuman()` (pendiente de implementar en `Keywords/`), llevan la etiqueta `human` (y `visible` si la persona interactúa con la página) y viven en una Test Suite propia ([ADR-005](docs/adr/ADR-005-katalon-human-in-the-loop.md)).
- **Evidencias**: log de ejecución, captura automática al fallar, video en web y capturas por paso clave en móvil; en API, request, response y verificaciones registrados en el log ([ADR-003](docs/adr/ADR-003-katalon-execution-evidence.md)).

El detalle completo está en los [estándares](docs/standards/README.md).

## Reportes de ejecución

- **Katalon** escribe en `tests/katalon/Reports/<fecha>/<suite>/<fecha>/` el `JUnit_Report.xml`, el `execution0.log`, las capturas y los videos.
- **Allure** (`allurerc.mjs`): `npm run allure:katalon` convierte ese reporte con [scripts/katalon/junit-to-allure.mjs](scripts/katalon/junit-to-allure.mjs), adjunta las evidencias (los videos AVI o MOV, convertidos a MP4 si hay ffmpeg) y genera el reporte. Guarda el historial en `.allure/history.jsonl`. `allure-results/` es la fuente de la skill `generate-report`.

## Calidad y flujo de trabajo

- **Pre-commit**: Husky ejecuta lint-staged (ESLint y Prettier sobre `scripts/**/*.mjs`, Prettier sobre `*.{json,md}`).
- **Mensajes de commit**: commitlint los valida en el hook `commit-msg`.
- **Commits**: se siguen Conventional Commits ([ADR-001](docs/adr/ADR-001-conventional-commits.md)).
- **Validaciones de arquitectura**: `npm run arch` comprueba que el repositorio cumple los criterios verificables de los estándares ([scripts/arch/](scripts/arch/README.md)).

## Documentación

- [Decisiones de arquitectura (ADR)](docs/adr/README.md)
- [Estándares técnicos](docs/standards/README.md)
- [AGENTS.md](AGENTS.md): reglas del proyecto y stack tecnológico
- [Plantillas de reportes de calidad](docs/templates/): informe final de pruebas (DTG045), matriz de incidencias (DTG018), análisis de pruebas (DTG019), matriz de eventos (DTG020), pantallas de soporte (DTG022) y check list de calidad (DTG063). La skill `generate-report` de Kiro las usa para generar reportes en `docs/reports/`.
