import { Page, Locator, test } from '@playwright/test';

/**
 * Base Page Object Model class
 * Contains common functionality shared across all page objects
 */
export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the page
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    return this.page
      .locator(selector)
      .waitFor({
        state: 'visible',
        timeout,
      })
      .then(() => this.page.locator(selector));
  }

  /**
   * Click element with retry
   */
  async click(selector: string, retries = 3): Promise<void> {
    await test.step(`Click on "${selector}"`, async () => {
      for (let i = 0; i < retries; i++) {
        try {
          await this.waitForElement(selector);
          await this.page.locator(selector).click();
          return;
        } catch (error) {
          if (i === retries - 1) throw error;
          await this.page.waitForTimeout(1000);
        }
      }
    });
  }

  /**
   * Fill input field
   */
  async fill(selector: string, value: string): Promise<void> {
    await test.step(`Fill "${selector}"`, async () => {
      const element = await this.waitForElement(selector);
      await element.clear();
      await element.fill(value);
    });
  }

  /**
   * Get element text
   */
  async getText(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    return (await element.textContent()) || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }
}
