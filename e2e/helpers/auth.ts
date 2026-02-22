import { type Page } from '@playwright/test';

/**
 * Log in via the login page using email/password.
 * This mimics what a real user does — navigates to /login, fills the form, submits.
 */
export async function loginWithEmail(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login');

  // Wait for the login form to render
  await page.waitForSelector('input[id="email"]');

  // Fill credentials
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard (or wherever the redirect param points)
  await page.waitForURL(/\/(dashboard|today|vision|goals)/, {
    timeout: 15_000,
  });
}

/**
 * Log in using stored auth state (cookies/session).
 * Faster than loginWithEmail — skips the form flow.
 * Requires a saved auth state file from a prior login.
 */
export async function loginWithStoredState(
  page: Page,
  authStatePath: string
) {
  const context = page.context();
  await context.addCookies(
    (await import(authStatePath)).cookies || []
  );
  await page.goto('/dashboard');
  await page.waitForURL(/\/(dashboard|today)/, { timeout: 15_000 });
}

/**
 * Save the current auth state (cookies) to a file for reuse.
 */
export async function saveAuthState(page: Page, outputPath: string) {
  const context = page.context();
  await context.storageState({ path: outputPath });
}

/**
 * Check if the page has been redirected to the login page (not authenticated).
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  return page.url().includes('/login');
}

/**
 * Log out by navigating to settings and clicking sign out,
 * or by clearing cookies.
 */
export async function logout(page: Page) {
  // Clear browser state to force logout
  const context = page.context();
  await context.clearCookies();
  await page.goto('/login');
  await page.waitForURL(/\/login/);
}
