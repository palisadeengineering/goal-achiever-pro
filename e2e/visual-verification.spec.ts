import { test, expect } from '@playwright/test';
import { loginWithEmail } from './helpers/auth';
import { takeVerificationScreenshot, takeElementScreenshot } from './helpers/screenshots';

/**
 * Visual Verification Tests
 *
 * These tests are specifically designed for Claude Code's visual verification workflow:
 *
 * 1. Claude makes code changes
 * 2. Claude runs: npm run test:e2e:screenshots
 * 3. Screenshots are saved to e2e/screenshots/
 * 4. Claude reads the screenshots with the Read tool to visually verify
 *
 * Each test captures screenshots at specific UI states for inspection.
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe('Visual Verification - Public', () => {
  test('capture login page in all states', async ({ page }) => {
    // Default state
    await page.goto('/login');
    await page.waitForSelector('input[id="email"]');
    await takeVerificationScreenshot(page, 'visual-login-default');

    // Filled state
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'password');
    await takeVerificationScreenshot(page, 'visual-login-filled');

    // Magic link mode
    await page.click('text=Sign in with magic link instead');
    await takeVerificationScreenshot(page, 'visual-login-magic-link-mode');
  });

  test('capture responsive layouts', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.waitForSelector('input[id="email"]');
    await takeVerificationScreenshot(page, 'visual-responsive-desktop');

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForSelector('input[id="email"]');
    await takeVerificationScreenshot(page, 'visual-responsive-tablet');

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForSelector('input[id="email"]');
    await takeVerificationScreenshot(page, 'visual-responsive-mobile');
  });
});

test.describe('Visual Verification - Authenticated', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: credentials not set');

  test.beforeEach(async ({ page }) => {
    if (TEST_EMAIL && TEST_PASSWORD) {
      await loginWithEmail(page, TEST_EMAIL, TEST_PASSWORD);
    }
  });

  test('capture dashboard layout and components', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Full page
    await takeVerificationScreenshot(page, 'visual-dashboard-full', { fullPage: true });

    // Sidebar specifically
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]').first();
    if (await sidebar.isVisible()) {
      await takeElementScreenshot(page, 'nav, aside, [data-testid="sidebar"]', 'visual-dashboard-sidebar');
    }

    // Header
    const header = page.locator('header').first();
    if (await header.isVisible()) {
      await takeElementScreenshot(page, 'header', 'visual-dashboard-header');
    }
  });

  test('capture all main pages for visual review', async ({ page }) => {
    const pages = [
      { path: '/time-audit', name: 'time-audit' },
      { path: '/analytics', name: 'analytics' },
      { path: '/leverage', name: 'leverage' },
      { path: '/network', name: 'network' },
      { path: '/settings', name: 'settings' },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await page.waitForLoadState('domcontentloaded');
      // Give components time to render
      await page.waitForTimeout(1000);
      await takeVerificationScreenshot(page, `visual-page-${p.name}`, { fullPage: true });
    }
  });

  test('verify dark mode toggle', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Light mode screenshot
    await takeVerificationScreenshot(page, 'visual-theme-light');

    // Try to find and click theme toggle
    const themeToggle = page.locator(
      'button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="mode"], [data-testid="theme-toggle"]'
    );

    if (await themeToggle.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);
      await takeVerificationScreenshot(page, 'visual-theme-dark');
    }
  });
});
