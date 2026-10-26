import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { appUrl } from '../config/env';

/**
 * Página de entrada de Tripot (raíz de BASE_URL); sin sesión redirige al inicio de sesión.
 */
export class HomePage extends BasePage {
  static readonly SIGN_IN_HEADING =
    'h1:has-text("Sign in"), h2:has-text("Sign in")';

  async goto(): Promise<void> {
    await this.page.goto(appUrl());
    await this.waitForPageLoad();
  }

  async getSignInHeading(): Promise<Locator> {
    return this.waitForElement(HomePage.SIGN_IN_HEADING);
  }
}
