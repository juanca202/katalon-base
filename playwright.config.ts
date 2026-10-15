import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  // Test directory
  testDir: './tests/playwright',

  // Run tests in files in parallel
  fullyParallel: true,

  // Las pruebas con intervención humana (@human) solo corren con npm run test:human
  grepInvert: /@human/,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html'],
    [
      'allure-playwright',
      {
        outputFolder: 'allure-results',
        // Sin suite por archivo: el árbol lo define allurerc.mjs (groupBy)
        suiteTitle: false,
        // Muestra el paso a paso: test.step, hooks, fixtures, expect y
        // llamadas de Playwright (page.goto, click, fill, etc.)
        detail: true,
        // Adjunta al reporte screenshots, videos y traces de cada prueba
        includeAttachments: true,
        categories: [
          {
            name: 'Ignored tests',
            matchedStatuses: ['skipped'],
          },
          {
            name: 'Infrastructure problems',
            matchedStatuses: ['broken', 'failed'],
            messageRegex: '.*timeout.*',
          },
          {
            name: 'Outdated tests',
            matchedStatuses: ['broken'],
            traceRegex: '.*FileNotFound.*',
          },
          {
            name: 'Product defects',
            matchedStatuses: ['failed'],
          },
        ],
      },
    ],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./tests/playwright/setup/global-setup.ts'),
  globalTeardown:
    require.resolve('./tests/playwright/setup/global-teardown.ts'),

  // Shared settings for all tests
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Global test timeout
    actionTimeout: 10000,

    // Collect trace on every run (ADR-007)
    trace: 'on',

    // Video only for scenarios that need it; override per test/project (ADR-007)
    video: 'on',

    // Screenshot only for scenarios that need it; override per test/project (ADR-007)
    screenshot: 'on',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // Por ahora solo Chrome (escritorio y móvil). Para reactivar otros browsers,
  // agregar proyectos con devices['Desktop Firefox'], devices['Desktop Safari']
  // o devices['iPhone 12'].
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/api/**',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      testIgnore: '**/api/**',
      use: { ...devices['Pixel 5'] },
    },
    // API Testing project
    {
      name: 'api-tests',
      testDir: './tests/playwright/api',
      use: {
        baseURL: process.env.API_BASE_URL || 'https://api.example.com',
      },
    },
  ],

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'test-results/',

  // Run your local dev server before starting the tests
  webServer:
    process.env.START_LOCAL_SERVER === 'true'
      ? {
          command: 'npm run dev',
          port: 3000,
          reuseExistingServer: !process.env.CI,
        }
      : undefined,
});
