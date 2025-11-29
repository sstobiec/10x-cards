import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Review Section
 * 
 * Represents the review stage where users can:
 * - Review generated flashcard proposals
 * - Edit, delete, or flag flashcards
 * - Set the flashcard set name
 * - Save the flashcard set
 */
export class ReviewPage {
  readonly page: Page;
  
  // Set name input and save button
  readonly setNameInput: Locator;
  readonly saveSetButton: Locator;
  
  // Flashcard proposals list
  readonly proposalsList: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Set management
    this.setNameInput = page.getByTestId("set-name-input");
    this.saveSetButton = page.getByTestId("save-flashcard-set-button");
    
    // Proposals list
    this.proposalsList = page.getByTestId("flashcard-proposals-list");
  }

  /**
   * Get all flashcard proposal items
   */
  getProposalItems(): Locator {
    return this.page.getByTestId("flashcard-proposal-item");
  }

  /**
   * Get a specific flashcard proposal by index (0-based)
   * @param index - The index of the proposal
   */
  getProposalByIndex(index: number): Locator {
    return this.getProposalItems().nth(index);
  }

  /**
   * Get the number of flashcard proposals
   */
  async getProposalsCount(): Promise<number> {
    return await this.getProposalItems().count();
  }

  /**
   * Get the avers (front) text of a flashcard by index
   * @param index - The index of the proposal
   */
  async getAversText(index: number): Promise<string> {
    return await this.getProposalByIndex(index)
      .getByTestId("flashcard-avers")
      .textContent() || "";
  }

  /**
   * Get the rewers (back) text of a flashcard by index
   * @param index - The index of the proposal
   */
  async getRewersText(index: number): Promise<string> {
    return await this.getProposalByIndex(index)
      .getByTestId("flashcard-rewers")
      .textContent() || "";
  }

  /**
   * Click the edit button for a specific flashcard
   * @param index - The index of the proposal to edit
   */
  async clickEdit(index: number): Promise<void> {
    await this.getProposalByIndex(index)
      .getByTestId("edit-flashcard-button")
      .click();
  }

  /**
   * Click the flag button for a specific flashcard
   * @param index - The index of the proposal to flag
   */
  async clickFlag(index: number): Promise<void> {
    await this.getProposalByIndex(index)
      .getByTestId("flag-flashcard-button")
      .click();
  }

  /**
   * Click the delete button for a specific flashcard
   * @param index - The index of the proposal to delete
   */
  async clickDelete(index: number): Promise<void> {
    await this.getProposalByIndex(index)
      .getByTestId("delete-flashcard-button")
      .click();
  }

  /**
   * Edit the avers (front) of a flashcard in edit mode
   * @param index - The index of the proposal
   * @param newText - The new text for the avers
   */
  async editAvers(index: number, newText: string): Promise<void> {
    const input = this.getProposalByIndex(index)
      .getByTestId("edit-flashcard-avers-input");
    await input.fill(newText);
  }

  /**
   * Edit the rewers (back) of a flashcard in edit mode
   * @param index - The index of the proposal
   * @param newText - The new text for the rewers
   */
  async editRewers(index: number, newText: string): Promise<void> {
    const input = this.getProposalByIndex(index)
      .getByTestId("edit-flashcard-rewers-input");
    await input.fill(newText);
  }

  /**
   * Save the edit for a flashcard
   * @param index - The index of the proposal
   */
  async saveEdit(index: number): Promise<void> {
    await this.getProposalByIndex(index)
      .getByTestId("save-edit-flashcard-button")
      .click();
  }

  /**
   * Cancel the edit for a flashcard
   * @param index - The index of the proposal
   */
  async cancelEdit(index: number): Promise<void> {
    await this.getProposalByIndex(index)
      .getByTestId("cancel-edit-flashcard-button")
      .click();
  }

  /**
   * Complete flow: Edit a flashcard (avers and rewers)
   * @param index - The index of the proposal to edit
   * @param newAvers - The new avers text
   * @param newRewers - The new rewers text
   */
  async editFlashcard(index: number, newAvers: string, newRewers: string): Promise<void> {
    await this.clickEdit(index);
    await this.editAvers(index, newAvers);
    await this.editRewers(index, newRewers);
    await this.saveEdit(index);
  }

  /**
   * Set the flashcard set name
   * @param name - The name for the flashcard set
   */
  async setFlashcardSetName(name: string): Promise<void> {
    await this.setNameInput.fill(name);
  }

  /**
   * Click the save flashcard set button
   */
  async clickSaveSet(): Promise<void> {
    await this.saveSetButton.click();
  }

  /**
   * Check if the save button is disabled
   */
  async isSaveButtonDisabled(): Promise<boolean> {
    return await this.saveSetButton.isDisabled();
  }

  /**
   * Complete flow: Set name and save the flashcard set
   * @param setName - The name for the flashcard set
   */
  async saveFlashcardSet(setName: string): Promise<void> {
    await this.setFlashcardSetName(setName);
    await this.clickSaveSet();
  }
}

