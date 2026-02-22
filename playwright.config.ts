import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Goal Achiever Pro
 *
 * Usage:
 *   npm run test:e2e           — run all E2E tests headless
 *   npm run test:e2e:ui        — run with Playwright UI mode
 *   npm run test:e2e:headed    — run with visible browser
 *   npm run test:e2e:debug     — run in debug mode (step through)
 *
 * Screenshots are saved to e2e/screenshots/ for Claude to inspect visually.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',

  /* Run tests sequentially by default (E2E tests share state) */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker for E2E to avoid auth conflicts */
  workers: 1,

  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'e2e/report', open: 'never' }],
    ['list'],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL for the dev server */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Capture screenshots on failure + at verification points */
    screenshot: 'on',

    /* Capture trace on first retry */
    trace: 'on-first-retry',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Timeout for each action */
    actionTimeout: 10_000,

    /* Timeout for navigation */
    navigationTimeout: 30_000,
  },

  /* Global test timeout */
  timeout: 60_000,

  /* Configure projects (browsers) */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use system Chrome if Playwright's isn't installed
        channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || undefined,
      },
    },
  ],

  /* Start dev server before tests (if not already running) */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
