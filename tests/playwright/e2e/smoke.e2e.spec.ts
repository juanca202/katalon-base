import { test, expect } from '@playwright/test';
import { HomePage } from '../../../src/pages/HomePage';
import { acceptanceCriterion } from '../../../src/helpers/traceability';

// Prueba de humo: confirma que la suite corre contra BASE_URL.
// Reemplazar US/AC/TC por los identificadores reales de Azure DevOps.
acceptanceCriterion(
  'US-0: Disponibilidad de Tripot',
  'AC-0: La aplicación carga',
  () => {
    test('TC-0: un usuario anónimo llega a la pantalla de inicio de sesión', async ({
      page,
    }) => {
      // Arrange
      const home = new HomePage(page);

      // Act
      await home.goto();

      // Assert
      await expect(page).toHaveTitle('Sign in');
      await expect(await home.getSignInHeading()).toBeVisible();
    });
  }
);
