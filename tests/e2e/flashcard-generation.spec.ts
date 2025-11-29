import { test, expect } from "@playwright/test";
import { GenerationPage, ReviewPage, SuccessPage } from "./pages";
import { SAMPLE_NOTES, SET_NAMES, FLASHCARD_CONTENT } from "./fixtures/test-data";
import { waitForNetworkIdle, verifyUrl, loginAsTestUser } from "./helpers";

/**
 * E2E Test Suite: Flashcard Generation Flow
 *
 * Tests the complete user journey from generating flashcards to saving a set
 */
test.describe("Flashcard Generation Flow", () => {
  let generationPage: GenerationPage;
  let reviewPage: ReviewPage;
  let successPage: SuccessPage;

  test.beforeEach(async ({ page }) => {
    // Login first (required for /generate route)
    await loginAsTestUser(page);

    // Initialize page objects
    generationPage = new GenerationPage(page);
    reviewPage = new ReviewPage(page);
    successPage = new SuccessPage(page);

    // Navigate to the generation page
    await generationPage.goto();
    await waitForNetworkIdle(page);
  });

  test("should complete the full flashcard generation flow", async () => {
    // Step 1-2: Fill the text input with sample notes
    await generationPage.fillText(SAMPLE_NOTES.LONG);

    // Step 2: Verify character counter is visible and updating
    const characterCount = await generationPage.getCharacterCount();
    expect(characterCount).toContain("/");
    expect(characterCount).toContain("10");

    // Step 3: Click generate button
    await generationPage.clickGenerate();

    // Verify loading state appears
    await generationPage.waitForLoading();

    // Wait for generation to complete
    await generationPage.waitForLoadingToComplete();

    // Step 4: Verify flashcard proposals are displayed
    const proposalsCount = await reviewPage.getProposalsCount();
    expect(proposalsCount).toBeGreaterThan(0);

    // Verify each flashcard has avers and rewers
    for (let i = 0; i < Math.min(proposalsCount, 3); i++) {
      const avers = await reviewPage.getAversText(i);
      const rewers = await reviewPage.getRewersText(i);

      expect(avers.length).toBeGreaterThan(0);
      expect(rewers.length).toBeGreaterThan(0);
    }

    // Step 5: Set the flashcard set name
    await reviewPage.setFlashcardSetName(SET_NAMES.HISTORY);

    // Step 6: Save the flashcard set
    await reviewPage.clickSaveSet();

    // Step 7: Verify success screen
    await successPage.waitForSuccess();

    expect(await successPage.isVisible()).toBe(true);

    const successMessage = await successPage.getSuccessMessage();
    expect(successMessage).toContain("Zestaw zapisany");

    // Verify set details
    const displayedSetName = await successPage.getSetName();
    expect(displayedSetName).toBe(SET_NAMES.HISTORY);

    // Verify action buttons are available
    expect(await successPage.startLearningButton.isVisible()).toBe(true);
    expect(await successPage.generateAnotherSetButton.isVisible()).toBe(true);
    expect(await successPage.viewAllSetsButton.isVisible()).toBe(true);
  });

  test("should allow editing a flashcard proposal", async () => {
    // Generate flashcards first
    await generationPage.generateFlashcards(SAMPLE_NOTES.SHORT);

    // Verify we have proposals
    const count = await reviewPage.getProposalsCount();
    expect(count).toBeGreaterThan(0);

    // Edit the first flashcard
    await reviewPage.clickEdit(0);

    // Update the content with test data
    await reviewPage.editAvers(0, FLASHCARD_CONTENT.SIMPLE.avers);
    await reviewPage.editRewers(0, FLASHCARD_CONTENT.SIMPLE.rewers);

    // Save the edit
    await reviewPage.saveEdit(0);

    // Verify the changes were applied
    const updatedAvers = await reviewPage.getAversText(0);
    const updatedRewers = await reviewPage.getRewersText(0);

    expect(updatedAvers).toBe(FLASHCARD_CONTENT.SIMPLE.avers);
    expect(updatedRewers).toBe(FLASHCARD_CONTENT.SIMPLE.rewers);
  });

  test("should allow flagging a flashcard", async () => {
    // Generate flashcards first
    await generationPage.generateFlashcards(SAMPLE_NOTES.SHORT);

    // Verify we have proposals
    const count = await reviewPage.getProposalsCount();
    expect(count).toBeGreaterThan(0);

    // Flag the first flashcard
    await reviewPage.clickFlag(0);

    // Verify the flashcard shows flagged state
    const proposal = reviewPage.getProposalByIndex(0);
    await expect(proposal).toContainText("Oflagowane");
  });

  test("should allow deleting a flashcard proposal", async () => {
    // Generate flashcards with multiple items
    await generationPage.generateFlashcards(SAMPLE_NOTES.MULTIPLE_TOPICS);

    // Get initial count
    const initialCount = await reviewPage.getProposalsCount();
    expect(initialCount).toBeGreaterThan(1);

    // Delete the first flashcard
    await reviewPage.clickDelete(0);

    // Verify count decreased
    const newCount = await reviewPage.getProposalsCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test("should disable save button when set name is empty", async () => {
    // Generate flashcards
    await generationPage.generateFlashcards(SAMPLE_NOTES.SHORT);

    // Verify save button is disabled with empty name
    expect(await reviewPage.isSaveButtonDisabled()).toBe(true);

    // Fill the set name
    await reviewPage.setFlashcardSetName(SET_NAMES.SHORT);

    // Verify save button is now enabled
    expect(await reviewPage.isSaveButtonDisabled()).toBe(false);
  });

  test("should disable generate button when text is empty", async () => {
    // Verify button is disabled on empty input
    expect(await generationPage.isGenerateButtonDisabled()).toBe(true);

    // Add text
    await generationPage.fillText(SAMPLE_NOTES.SHORT);

    // Verify button is now enabled
    expect(await generationPage.isGenerateButtonDisabled()).toBe(false);
  });

  test("should navigate back to generation form from success page", async ({ page }) => {
    // Complete the generation flow
    await generationPage.generateFlashcards(SAMPLE_NOTES.TECHNICAL);
    await reviewPage.saveFlashcardSet(SET_NAMES.PROGRAMMING);
    await successPage.waitForSuccess();

    // Click "Generate Another Set"
    await successPage.clickGenerateAnotherSet();

    // Verify we're back on the generation page
    await verifyUrl(page, /\/generate/);
    expect(await generationPage.textInput.isVisible()).toBe(true);
    expect(await generationPage.generateButton.isVisible()).toBe(true);
  });
});

/**
 * E2E Test Suite: Error Handling
 *
 * Note: These tests are skipped as they require API mocking setup
 */
test.describe("Error Handling", () => {
  test.skip("should display error message when generation fails", async () => {
    // This test would require mocking API failure
    // Implementation depends on your error simulation strategy
  });
});
