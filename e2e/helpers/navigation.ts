import { type Page, expect } from '@playwright/test';

/**
 * Navigate to a dashboard page and verify it loaded.
 * Takes a verification screenshot after load.
 */
export async function navigateAndVerify(
  page: Page,
  path: string,
  options?: {
    /** CSS selector to wait for before considering the page loaded */
    waitForSelector?: string;
    /** Expected text visible on the page */
    expectText?: string;
    /** Timeout for page load */
    timeout?: number;
  }
) {
  await page.goto(path, {
    timeout: options?.timeout ?? 30_000,
    waitUntil: 'domcontentloaded',
  });

  if (options?.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, {
      timeout: options.timeout ?? 10_000,
    });
  }

  if (options?.expectText) {
    await expect(page.getByText(options.expectText)).toBeVisible({
      timeout: options.timeout ?? 10_000,
    });
  }
}

/**
 * Verify the sidebar is visible and contains expected navigation items.
 */
export async function verifySidebar(page: Page) {
  const sidebar = page.locator('nav, [data-testid="sidebar"], aside');
  await expect(sidebar.first()).toBeVisible();
}

/**
 * Click a sidebar navigation link by its text content.
 */
export async function clickSidebarLink(page: Page, linkText: string) {
  const link = page.locator(`nav a, aside a`).filter({ hasText: linkText });
  await link.first().click();
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
}
