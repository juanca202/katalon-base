import { test } from '@playwright/test';
import { allure } from 'allure-playwright';

/** Plataforma por proyecto de Playwright (nivel 2 del árbol, solo en E2E). */
const PLATFORM_BY_PROJECT: Record<string, string> = {
  chromium: 'Web desktop',
  'Mobile Chrome': 'Web mobile',
};

/** Tipo de prueba según la carpeta del spec (nivel 1 del árbol de Allure). */
function testType(file: string): 'API' | 'E2E' {
  return /[\\/]api[\\/]/.test(file) ? 'API' : 'E2E';
}

/**
 * Agrupa pruebas bajo Historia -> Criterio de aceptación para que la
 * trazabilidad Historia -> AC -> TC se vea en Playwright y en Allure.
 *
 * - `story`: `US-XXX: título` de la historia de usuario.
 * - `criterion`: `AC-XXX: título` del criterio de aceptación.
 * - Las pruebas dentro del callback llevan su `TC-<id>:` en el título.
 *
 * En Allure el árbol queda como Tipo (parentSuite) -> Plataforma (suite, solo
 * en E2E) -> Historia (feature) -> Criterio (story) -> Caso de prueba. El
 * agrupado lo define `groupBy` en allurerc.mjs.
 */
export function acceptanceCriterion(
  story: string,
  criterion: string,
  body: () => void
): void {
  test.describe(story, () => {
    test.describe(criterion, () => {
      test.beforeEach(async () => {
        const testInfo = test.info();
        const type = testType(testInfo.file);
        await allure.parentSuite(type);
        if (type === 'E2E') {
          await allure.suite(
            PLATFORM_BY_PROJECT[testInfo.project.name] ?? testInfo.project.name
          );
        }
        await allure.feature(story);
        await allure.story(criterion);
      });

      body();
    });
  });
}
