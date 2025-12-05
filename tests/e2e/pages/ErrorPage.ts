import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Error Display
 *
 * Represents error states throughout the application
 */
export class ErrorPage {
  readonly page: Page;

  // Main container
  readonly errorDisplay: Locator;

  // Action buttons
  readonly retryButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Error container
    this.errorDisplay = page.getByTestId("error-display");

    // Action buttons
    this.retryButton = page.getByTestId("retry-button");
    this.resetButton = page.getByTestId("reset-button");
  }

  /**
   * Check if the error display is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.errorDisplay.isVisible();
  }

  /**
   * Wait for the error display to appear
   */
  async waitForError(): Promise<void> {
    await this.errorDisplay.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Get the error title text
   */
  async getErrorTitle(): Promise<string> {
    return (await this.errorDisplay.locator("h2").textContent()) || "";
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorDisplay.locator("p").first().textContent()) || "";
  }

  /**
   * Click the retry button
   */
  async clickRetry(): Promise<void> {
    await this.retryButton.click();
  }

  /**
   * Click the reset button
   */
  async clickReset(): Promise<void> {
    await this.resetButton.click();
  }

  /**
   * Check if retry button is visible
   */
  async isRetryButtonVisible(): Promise<boolean> {
    return await this.retryButton.isVisible();
  }

  /**
   * Check if reset button is visible
   */
  async isResetButtonVisible(): Promise<boolean> {
    return await this.resetButton.isVisible();
  }
}
