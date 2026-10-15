import { test } from '@playwright/test';
import {
  feature,
  label,
  parentSuite,
  story as allureStory,
} from 'allure-js-commons';

/**
 * Agrupa pruebas bajo Historia -> Criterio de aceptación para que la
 * trazabilidad Historia -> AC -> TC se vea en Playwright y en Allure.
 *
 * - `story`: `US-XXX: título` de la historia de usuario.
 * - `criterion`: `AC-XXX: título` del criterio de aceptación.
 * - Las pruebas dentro del callback llevan su `TC-<id>:` en el título.
 *
 * El tipo (`type`) y la plataforma (`platform`, solo en E2E) se definen en el
 * `metadata` de cada proyecto de playwright.config.ts. En Allure el árbol
 * queda como Tipo (parentSuite) -> Plataforma (platform) -> Historia (feature)
 * -> Criterio (story) -> Caso de prueba; el agrupado lo define `groupBy` en
 * allurerc.mjs. La plataforma usa una etiqueta propia y no `suite`, porque
 * allure-playwright rellena `suite` con el archivo cuando no la recibe.
 */
export function acceptanceCriterion(
  story: string,
  criterion: string,
  body: () => void
): void {
  test.describe(story, () => {
    test.describe(criterion, () => {
      test.beforeEach(async () => {
        const { type, platform } = test.info().project.metadata;
        await parentSuite(type);
        if (platform) await label('platform', platform);
        await feature(story);
        await allureStory(criterion);
      });

      body();
    });
  });
}
