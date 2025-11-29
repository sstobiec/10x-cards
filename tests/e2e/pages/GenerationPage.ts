import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Flashcard Generation Page
 * 
 * Represents the /generate route where users input text and generate flashcards
 */
export class GenerationPage {
  readonly page: Page;
  
  // Locators
  readonly textInput: Locator;
  readonly characterCounter: Locator;
  readonly generateButton: Locator;
  readonly loadingSpinner: Locator;
  readonly loadingMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form elements
    this.textInput = page.getByTestId("generation-text-input");
    this.characterCounter = page.getByTestId("character-counter");
    this.generateButton = page.getByTestId("generate-flashcards-button");
    
    // Loading state
    this.loadingSpinner = page.getByTestId("loading-spinner");
    this.loadingMessage = page.getByTestId("loading-message");
  }

  /**
   * Navigate to the generation page
   */
  async goto(): Promise<void> {
    await this.page.goto("/generate");
  }

  /**
   * Fill the text input with notes
   * @param text - The text content to input
   */
  async fillText(text: string): Promise<void> {
    await this.textInput.fill(text);
  }

  /**
   * Get the current character count from the counter
   * @returns The character count as a string (e.g., "150 / 10 000")
   */
  async getCharacterCount(): Promise<string> {
    return await this.characterCounter.textContent() || "";
  }

  /**
   * Click the generate flashcards button
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Check if the generate button is disabled
   */
  async isGenerateButtonDisabled(): Promise<boolean> {
    return await this.generateButton.isDisabled();
  }

  /**
   * Wait for loading to appear
   */
  async waitForLoading(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: "visible" });
  }

  /**
   * Wait for loading to disappear
   */
  async waitForLoadingToComplete(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: "hidden", timeout: 60000 });
  }

  /**
   * Complete flow: fill text and generate flashcards
   * @param text - The text content to generate flashcards from
   */
  async generateFlashcards(text: string): Promise<void> {
    await this.fillText(text);
    await this.clickGenerate();
    await this.waitForLoadingToComplete();
  }
}

