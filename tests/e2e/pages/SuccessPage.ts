import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Success Display
 * 
 * Represents the success screen after saving a flashcard set
 */
export class SuccessPage {
  readonly page: Page;
  
  // Main container
  readonly successDisplay: Locator;
  
  // Action buttons
  readonly startLearningButton: Locator;
  readonly generateAnotherSetButton: Locator;
  readonly viewAllSetsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Success container
    this.successDisplay = page.getByTestId("success-display");
    
    // Navigation buttons
    this.startLearningButton = page.getByTestId("start-learning-button");
    this.generateAnotherSetButton = page.getByTestId("generate-another-set-button");
    this.viewAllSetsButton = page.getByTestId("view-all-sets-button");
  }

  /**
   * Check if the success display is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.successDisplay.isVisible();
  }

  /**
   * Wait for the success display to appear
   */
  async waitForSuccess(): Promise<void> {
    await this.successDisplay.waitFor({ state: "visible", timeout: 60000 });
  }

  /**
   * Get the success message text
   */
  async getSuccessMessage(): Promise<string> {
    return await this.successDisplay
      .locator("h2")
      .textContent() || "";
  }

  /**
   * Get the set name from the details section
   */
  async getSetName(): Promise<string> {
    const setNameElement = this.successDisplay
      .locator("dl")
      .locator("dd")
      .first();
    return await setNameElement.textContent() || "";
  }

  /**
   * Get the flashcard count from the details section
   */
  async getFlashcardCount(): Promise<string> {
    const flashcardCountElement = this.successDisplay
      .locator("dl")
      .locator("dd")
      .nth(1);
    return await flashcardCountElement.textContent() || "";
  }

  /**
   * Click the "Start Learning" button and wait for navigation
   */
  async clickStartLearning(): Promise<void> {
    await this.startLearningButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click the "Generate Another Set" button
   */
  async clickGenerateAnotherSet(): Promise<void> {
    await this.generateAnotherSetButton.click();
  }

  /**
   * Click the "View All Sets" button and wait for navigation
   */
  async clickViewAllSets(): Promise<void> {
    await this.viewAllSetsButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Extract the set ID from the "Start Learning" button href
   */
  async getSetId(): Promise<string | null> {
    const href = await this.startLearningButton.getAttribute("href");
    if (!href) return null;
    
    // Extract ID from /sets/{id} format
    const match = href.match(/\/sets\/([^/]+)/);
    return match ? match[1] : null;
  }
}

