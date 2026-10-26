# Stack tecnológico

## Lenguaje y runtime

- **TypeScript** (modo `strict`, target ES2022, módulo CommonJS). Config en `tsconfig.json`.
- **Node.js 20+**.

## Runners de pruebas

- **Playwright** (`@playwright/test`) — E2E web y API (`APIRequestContext` para REST y GraphQL). Config en `playwright.config.ts` (proyectos `chromium`, `Mobile Chrome`, `api-tests`) y `playwright.human.config.ts` para pruebas `@human`.
- **Maestro** — apps nativas o híbridas Android e iOS (`tests/maestro/`), integrado vía scripts en `scripts/maestro/`.

## Librerías principales

- **Allure** (`allure`, `allure-playwright`, `allure-js-commons`) — reportería; config en `allurerc.mjs`, historial en `.allure/history.jsonl`.
- **MSW** — mocks HTTP desde `src/mocks/`; service worker en `public/`.
- **dotenv** — variables de ambiente, leídas únicamente a través de `src/config/env.ts`.

## Calidad y tooling

- **ESLint** (`eslint.config.js`, con `@typescript-eslint` y `eslint-plugin-playwright`). Valida la convención `TC-<id>` en títulos de pruebas.
- **Prettier** (`.prettierrc`): `semi: true`, `singleQuote: true`, `trailingComma: es5`, `printWidth: 80`, `tabWidth: 2`, `arrowParens: avoid`.
- **Husky + lint-staged** — pre-commit: ESLint + Prettier sobre `*.{ts,js}`, Prettier sobre `*.{json,md}`.
- **Conventional Commits** para los mensajes de commit.
- **Azure Pipelines** (`azure-pipelines.yml`) — CI.

## Reglas importantes

- URLs y credenciales nunca se hardcodean: provienen de `.env` (`BASE_URL`, `API_BASE_URL`, `TEST_USER_*`) vía `src/config/env.ts`. Los datos dependientes del ambiente no se versionan.
- Las decisiones técnicas están documentadas como ADRs en `docs/adr/` y los estándares en `docs/standards/`; respétalos.

## Comandos comunes

### Pruebas

- `npm test` — todas las pruebas Playwright + reporte Allure
- `npm run test:e2e` — solo E2E
- `npm run test:api` — solo API
- `npm run test:web-desktop` / `npm run test:web-mobile` — proyecto `chromium` / `Mobile Chrome`
- `npm run test:mobile` — apps con Maestro
- `npm run test:all` — Playwright + Maestro en un único reporte
- `npm run test:human` — pruebas Human-in-the-Loop (`@human`)
- `npm run test:headed` / `npm run test:ui` / `npm run test:debug` — modos visible / interactivo / debug

### Reportes

- `npm run allure:generate` — genera el reporte desde `allure-results/`
- `npm run allure:serve` — genera y abre el reporte
- `npm run allure:open` — abre un reporte ya generado

### Calidad

- `npm run lint` / `npm run lint:fix`
- `npm run format` / `npm run format:check`
- `npm run build` — compila TypeScript
- `npm run quality:check` — lint + format:check + build
- `npm run arch` — validaciones de arquitectura contra `docs/standards/`

### Instalación y mantenimiento

- `npm install` + `npm run install:browsers`
- `npm run install:deps` — dependencias de sistema de los browsers
- `npm run emulator:start` / `emulator:start:play` / `emulator:stop` — emulador Android
- `npm run clean` — elimina `dist`, `allure-results`, `allure-report`, `test-results`
