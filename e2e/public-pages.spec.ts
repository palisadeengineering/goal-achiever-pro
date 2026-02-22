import { test, expect } from '@playwright/test';
import { takeVerificationScreenshot } from './helpers/screenshots';

/**
 * Public Pages Tests
 *
 * These tests verify public pages load correctly WITHOUT authentication.
 * They are safe to run without any test credentials.
 */

test.describe('Public Pages', () => {
  test('homepage loads with marketing content', async ({ page }) => {
    await page.goto('/');

    // Page should load without errors
    await expect(page).toHaveTitle(/Goal Achiever/i);

    // Take screenshot for visual verification
    await takeVerificationScreenshot(page, 'homepage-loaded', { fullPage: true });
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    // Should show the login form
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Should have Google sign-in option
    await expect(page.getByText(/Continue with Google/i)).toBeVisible();

    // Should have link to signup
    await expect(page.getByText(/Sign up/i)).toBeVisible();

    await takeVerificationScreenshot(page, 'login-page');
  });

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/signup');

    // Should show signup form elements
    await expect(page.locator('input[type="email"], input[id="email"]').first()).toBeVisible();

    await takeVerificationScreenshot(page, 'signup-page');
  });

  test('login page shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[id="email"]', 'invalid@test.com');
    await page.fill('input[id="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');

    // Should show an error message (wait for the API response)
    const errorMsg = page.locator('[class*="red"], [class*="error"], [role="alert"]');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10_000 });

    await takeVerificationScreenshot(page, 'login-error-state');
  });

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Try to visit a protected route
    await page.goto('/dashboard');

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');

    await takeVerificationScreenshot(page, 'redirect-to-login');
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');

    // Should not error out (200 or rendered page)
    await page.waitForLoadState('domcontentloaded');

    await takeVerificationScreenshot(page, 'pricing-page', { fullPage: true });
  });
});
