# Product

Automated test framework (`test-katalon`) for testing external web apps, APIs, and native/hybrid mobile apps **without access to their source code**. Tests run against a deployed application.

The primary system under test is **Tripot**, a personal-finance web application. Tripot's source code does not live in this repository. The target URLs and credentials come from the `.env` file (`BASE_URL`, `API_BASE_URL`, `TEST_USER_*`) and are never hardcoded.

## Capabilities

- E2E web testing and API testing via Playwright + TypeScript (`tests/playwright/`)
- Native/hybrid Android & iOS app testing via Maestro (`tests/maestro/`)
- Advanced reporting with Allure (failure categorization, history, trends)
- HTTP mocking with MSW
- Azure DevOps traceability: each test maps to a Test Case (`TC-<id>`)
- Quality report templates (DTG formats) generated into `docs/reports/`

## Key conventions

- Every test title starts with its Azure DevOps Test Case id, one `TC-<id>` per test (e.g. `TC-1234: crear usuario devuelve 201`). ESLint enforces this.
- Tests are grouped by Story → Acceptance Criterion using `acceptanceCriterion()` from `src/helpers/traceability.ts` (`US-XXX` / `AC-XXX`).
- Two test types: Fully Automated and Human-in-the-Loop (`@human`, with `@visible` when manual UI interaction is needed). Human tests run only via `npm run test:human`.
