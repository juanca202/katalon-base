# Estructura del proyecto

```
├── src/                     # Código fuente del framework (no las pruebas)
│   ├── config/             # env.ts: única fuente de variables de ambiente
│   ├── pages/              # Page Objects: BasePage.ts y páginas *Page.ts derivadas
│   ├── helpers/            # traceability.ts, human-intervention.ts, api-evidence.ts
│   ├── fixtures/           # Datos de prueba
│   └── mocks/              # Handlers y worker de MSW
├── tests/                   # Suites de pruebas, una carpeta por runner
│   ├── playwright/         # Pruebas con Playwright
│   │   ├── e2e/           # End-to-End web
│   │   ├── api/           # API (REST y GraphQL)
│   │   ├── setup/         # Global setup y teardown
│   │   └── utils/         # Utilidades de testing
│   └── maestro/           # Flujos Maestro para apps nativas/híbridas
├── public/                  # mockServiceWorker.js (MSW)
├── scripts/                 # Automatización
│   ├── arch/              # Fitness functions (npm run arch)
│   ├── maestro/           # Ejecución y conversión JUnit→Allure de Maestro
│   └── emulator/          # Arranque/parada del emulador Android
├── docs/                    # Documentación técnica
│   ├── adr/              # Architectural Decision Records
│   ├── standards/        # Estándares técnicos
│   ├── templates/        # Plantillas de reportes de calidad (DTG)
│   ├── formats/          # Formatos originales (xlsx/pdf)
│   ├── specs/            # Especificaciones de trabajo (SDD DevKit)
│   └── reports/          # Reportes generados
├── allure-results/          # Resultados crudos (fuente de reportes y evidencias)
├── allure-report/           # Reporte Allure generado
├── test-results/            # Evidencias originales de Playwright y Maestro
├── playwright.config.ts     # Config Playwright (proyectos, reporters, evidencias)
├── playwright.human.config.ts # Config para pruebas @human
├── allurerc.mjs             # Config Allure
├── azure-pipelines.yml      # Pipeline de CI
├── AGENTS.md                # Reglas y stack para agentes de IA
├── .agents/                 # Memoria persistente del proyecto (MEMORY.md)
└── .kiro/                   # Steering y skills de Kiro
```

## Convenciones de organización

- **Page Object Model**: las páginas son clases `*Page.ts` que extienden `BasePage` (en `src/pages/`). La lógica de interacción vive en los Page Objects, no en los tests.
- **Separación código/pruebas**: `src/` contiene el framework reutilizable; `tests/` contiene únicamente las suites, organizadas por runner y luego por tipo (`e2e`, `api`).
- **Un runner por carpeta** dentro de `tests/`: Playwright y Maestro no se mezclan.
- **Trazabilidad**: agrupa pruebas con `acceptanceCriterion('US-XXX...', 'AC-XXX...', () => {...})` y titula cada `test()` con su `TC-<id>`.
- **Nombres**: archivos TypeScript en PascalCase para clases/Page Objects (`HomePage.ts`) y kebab/camel para helpers (`human-intervention.ts`).
- **Configuración y secretos**: accede a variables de ambiente solo mediante `src/config/env.ts`; nunca leas `process.env` directamente en pruebas ni hardcodees URLs/credenciales.
