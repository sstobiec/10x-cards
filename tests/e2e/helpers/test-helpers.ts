import { Page, expect } from "@playwright/test";

/**
 * Test Helper Functions
 *
 * Reusable utility functions for E2E tests
 */

/**
 * Wait for network to be idle
 * @param page - Playwright page object
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for all animations to complete
 * @param page - Playwright page object
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.waitForTimeout(300);
}

/**
 * Take a screenshot with a descriptive name
 * @param page - Playwright page object
 * @param name - Screenshot name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
}

/**
 * Clear all inputs on the page
 * @param page - Playwright page object
 */
export async function clearAllInputs(page: Page): Promise<void> {
  const inputs = await page.locator("input, textarea").all();
  for (const input of inputs) {
    await input.clear();
  }
}

/**
 * Check if an element contains specific text
 * @param page - Playwright page object
 * @param selector - Element selector
 * @param text - Text to check for
 */
export async function elementContainsText(page: Page, selector: string, text: string): Promise<boolean> {
  const element = page.locator(selector);
  const content = await element.textContent();
  return content?.includes(text) ?? false;
}

/**
 * Wait for element to be visible and stable
 * @param page - Playwright page object
 * @param testId - data-testid value
 */
export async function waitForElement(page: Page, testId: string): Promise<void> {
  const element = page.getByTestId(testId);
  await element.waitFor({ state: "visible" });
  await element.waitFor({ state: "stable" });
}

/**
 * Count elements matching a selector
 * @param page - Playwright page object
 * @param testId - data-testid value
 */
export async function countElements(page: Page, testId: string): Promise<number> {
  return await page.getByTestId(testId).count();
}

/**
 * Get all text content from elements matching a selector
 * @param page - Playwright page object
 * @param testId - data-testid value
 */
export async function getAllTextContent(page: Page, testId: string): Promise<string[]> {
  const elements = await page.getByTestId(testId).all();
  const texts: string[] = [];

  for (const element of elements) {
    const text = await element.textContent();
    if (text) texts.push(text);
  }

  return texts;
}

/**
 * Verify URL matches expected pattern
 * @param page - Playwright page object
 * @param pattern - URL pattern (string or regex)
 */
export async function verifyUrl(page: Page, pattern: string | RegExp): Promise<void> {
  await expect(page).toHaveURL(pattern);
}

/**
 * Verify page title
 * @param page - Playwright page object
 * @param title - Expected title (string or regex)
 */
export async function verifyTitle(page: Page, title: string | RegExp): Promise<void> {
  await expect(page).toHaveTitle(title);
}

/**
 * Fill form with data
 * @param page - Playwright page object
 * @param formData - Object mapping testIds to values
 */
export async function fillForm(page: Page, formData: Record<string, string>): Promise<void> {
  for (const [testId, value] of Object.entries(formData)) {
    await page.getByTestId(testId).fill(value);
  }
}

/**
 * Mock API response
 * @param page - Playwright page object
 * @param url - URL pattern to intercept
 * @param response - Mock response data
 */
export async function mockApiResponse(page: Page, url: string | RegExp, response: unknown): Promise<void> {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock API error
 * @param page - Playwright page object
 * @param url - URL pattern to intercept
 * @param statusCode - HTTP status code
 * @param message - Error message
 */
export async function mockApiError(
  page: Page,
  url: string | RegExp,
  statusCode: number,
  message: string
): Promise<void> {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: "application/json",
      body: JSON.stringify({ error: message }),
    });
  });
}

/**
 * Wait for and dismiss browser dialog (alert, confirm, prompt)
 * @param page - Playwright page object
 * @param accept - Whether to accept (true) or dismiss (false) the dialog
 */
export async function handleDialog(page: Page, accept = true): Promise<void> {
  page.once("dialog", async (dialog) => {
    if (accept) {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });
}

/**
 * Verify element visibility
 * @param page - Playwright page object
 * @param testId - data-testid value
 * @param visible - Expected visibility state
 */
export async function verifyElementVisibility(page: Page, testId: string, visible: boolean): Promise<void> {
  const element = page.getByTestId(testId);
  if (visible) {
    await expect(element).toBeVisible();
  } else {
    await expect(element).toBeHidden();
  }
}

/**
 * Verify element enabled/disabled state
 * @param page - Playwright page object
 * @param testId - data-testid value
 * @param enabled - Expected enabled state
 */
export async function verifyElementEnabled(page: Page, testId: string, enabled: boolean): Promise<void> {
  const element = page.getByTestId(testId);
  if (enabled) {
    await expect(element).toBeEnabled();
  } else {
    await expect(element).toBeDisabled();
  }
}

/**
 * Scroll element into view
 * @param page - Playwright page object
 * @param testId - data-testid value
 */
export async function scrollIntoView(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).scrollIntoViewIfNeeded();
}

/**
 * Get element attribute value
 * @param page - Playwright page object
 * @param testId - data-testid value
 * @param attribute - Attribute name
 */
export async function getAttributeValue(page: Page, testId: string, attribute: string): Promise<string | null> {
  return await page.getByTestId(testId).getAttribute(attribute);
}

/**
 * Press keyboard key
 * @param page - Playwright page object
 * @param key - Key to press (e.g., 'Enter', 'Escape')
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

/**
 * Type text with delay between keystrokes
 * @param page - Playwright page object
 * @param testId - data-testid value
 * @param text - Text to type
 * @param delay - Delay between keystrokes in milliseconds
 */
export async function typeWithDelay(page: Page, testId: string, text: string, delay = 100): Promise<void> {
  await page.getByTestId(testId).type(text, { delay });
}
