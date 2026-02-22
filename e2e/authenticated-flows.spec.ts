import { test, expect } from '@playwright/test';
import { loginWithEmail, logout } from './helpers/auth';
import { takeVerificationScreenshot } from './helpers/screenshots';
import { navigateAndVerify, verifySidebar } from './helpers/navigation';

/**
 * Authenticated Flow Tests
 *
 * These tests require valid test credentials set via environment variables:
 *   E2E_TEST_EMAIL    — test user email
 *   E2E_TEST_PASSWORD — test user password
 *
 * Run with:
 *   E2E_TEST_EMAIL=user@example.com E2E_TEST_PASSWORD=pass npm run test:e2e
 *
 * If credentials aren't set, these tests are skipped automatically.
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe('Authenticated Flows', () => {
  // Skip all tests if no credentials provided
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set');

  test.beforeEach(async ({ page }) => {
    if (TEST_EMAIL && TEST_PASSWORD) {
      await loginWithEmail(page, TEST_EMAIL, TEST_PASSWORD);
    }
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('login succeeds and lands on dashboard', async ({ page }) => {
    // After login, we should be on the dashboard
    expect(page.url()).toMatch(/\/(dashboard|today)/);

    // Sidebar should be visible
    await verifySidebar(page);

    await takeVerificationScreenshot(page, 'dashboard-after-login');
  });

  test('sidebar navigation works', async ({ page }) => {
    // Verify sidebar is present
    await verifySidebar(page);

    await takeVerificationScreenshot(page, 'sidebar-navigation');
  });

  test('vision page loads', async ({ page }) => {
    await navigateAndVerify(page, '/vision');

    await takeVerificationScreenshot(page, 'vision-page');
  });

  test('goals page loads', async ({ page }) => {
    await navigateAndVerify(page, '/goals');

    await takeVerificationScreenshot(page, 'goals-page');
  });

  test('time audit page loads', async ({ page }) => {
    await navigateAndVerify(page, '/time-audit');

    await takeVerificationScreenshot(page, 'time-audit-page');
  });

  test('MINS page loads', async ({ page }) => {
    await navigateAndVerify(page, '/mins');

    await takeVerificationScreenshot(page, 'mins-page');
  });

  test('routines page loads', async ({ page }) => {
    await navigateAndVerify(page, '/routines');

    await takeVerificationScreenshot(page, 'routines-page');
  });

  test('pomodoro timer page loads', async ({ page }) => {
    await navigateAndVerify(page, '/pomodoro');

    await takeVerificationScreenshot(page, 'pomodoro-page');
  });

  test('reviews page loads', async ({ page }) => {
    await navigateAndVerify(page, '/reviews');

    await takeVerificationScreenshot(page, 'reviews-page');
  });

  test('analytics page loads', async ({ page }) => {
    await navigateAndVerify(page, '/analytics');

    await takeVerificationScreenshot(page, 'analytics-page');
  });

  test('settings page loads', async ({ page }) => {
    await navigateAndVerify(page, '/settings');

    await takeVerificationScreenshot(page, 'settings-page');
  });
});
