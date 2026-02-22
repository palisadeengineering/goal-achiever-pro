import { type Page } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

/**
 * Take a named screenshot for Claude to visually inspect.
 *
 * Screenshots are saved to e2e/screenshots/ with descriptive names.
 * Claude Code can then read these images to verify the UI looks correct.
 *
 * @param page - Playwright page
 * @param name - Descriptive name (e.g., "dashboard-loaded", "login-error-state")
 * @param options - Optional: fullPage screenshot, clip region, etc.
 */
export async function takeVerificationScreenshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  }
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}_${timestamp}.png`;

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, filename),
    fullPage: options?.fullPage ?? false,
    clip: options?.clip,
  });

  return path.join(SCREENSHOTS_DIR, filename);
}

/**
 * Take a screenshot of a specific element for targeted verification.
 *
 * @param page - Playwright page
 * @param selector - CSS selector of the element to screenshot
 * @param name - Descriptive name for the screenshot
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  name: string
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}_${timestamp}.png`;

  const element = page.locator(selector);
  await element.screenshot({
    path: path.join(SCREENSHOTS_DIR, filename),
  });

  return path.join(SCREENSHOTS_DIR, filename);
}
