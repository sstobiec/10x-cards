# Page Object Model (POM) Documentation

This directory contains Page Object Model classes for E2E testing with Playwright.

## Overview

The Page Object Model is a design pattern that creates an object repository for web UI elements. It helps to reduce code duplication and improves test maintenance by centralizing element locators and page interactions.

## Structure

```
tests/e2e/pages/
├── GenerationPage.ts    # Page for flashcard generation form
├── ReviewPage.ts        # Page for reviewing and editing proposals
├── SuccessPage.ts       # Page for success confirmation
├── ErrorPage.ts         # Page for error handling
├── index.ts             # Central export file
└── README.md            # This file
```

## Page Objects

### GenerationPage

Represents the `/generate` route where users input text to generate flashcards.

**Key Methods:**
- `goto()` - Navigate to the generation page
- `fillText(text)` - Fill the text input with notes
- `getCharacterCount()` - Get current character count
- `clickGenerate()` - Click the generate button
- `generateFlashcards(text)` - Complete flow: fill and generate

**Locators:**
- `textInput` - Main text input field (`data-testid="generation-text-input"`)
- `characterCounter` - Character counter display (`data-testid="character-counter"`)
- `generateButton` - Generate flashcards button (`data-testid="generate-flashcards-button"`)
- `loadingSpinner` - Loading indicator (`data-testid="loading-spinner"`)

### ReviewPage

Represents the review section where users can edit, delete, or flag flashcard proposals and save the set.

**Key Methods:**
- `getProposalsCount()` - Get number of proposals
- `getAversText(index)` - Get front text of a flashcard
- `getRewersText(index)` - Get back text of a flashcard
- `clickEdit(index)` - Start editing a flashcard
- `editFlashcard(index, avers, rewers)` - Complete edit flow
- `clickFlag(index)` - Flag a flashcard as low quality
- `clickDelete(index)` - Delete a flashcard
- `setFlashcardSetName(name)` - Set the flashcard set name
- `saveFlashcardSet(name)` - Complete flow: set name and save

**Locators:**
- `setNameInput` - Set name input field (`data-testid="set-name-input"`)
- `saveSetButton` - Save set button (`data-testid="save-flashcard-set-button"`)
- `proposalsList` - Container for all proposals (`data-testid="flashcard-proposals-list"`)

### SuccessPage

Represents the success screen displayed after saving a flashcard set.

**Key Methods:**
- `waitForSuccess()` - Wait for success screen to appear
- `getSuccessMessage()` - Get the success message text
- `getSetName()` - Get the saved set name
- `getFlashcardCount()` - Get the number of flashcards
- `clickStartLearning()` - Navigate to learning mode
- `clickGenerateAnotherSet()` - Return to generation form
- `clickViewAllSets()` - Navigate to sets list
- `getSetId()` - Extract the set ID from the URL

**Locators:**
- `successDisplay` - Main success container (`data-testid="success-display"`)
- `startLearningButton` - Start learning link (`data-testid="start-learning-button"`)
- `generateAnotherSetButton` - Generate new set button (`data-testid="generate-another-set-button"`)
- `viewAllSetsButton` - View all sets link (`data-testid="view-all-sets-button"`)

### ErrorPage

Represents error states throughout the application.

**Key Methods:**
- `waitForError()` - Wait for error display to appear
- `getErrorTitle()` - Get the error title
- `getErrorMessage()` - Get the error message
- `clickRetry()` - Click retry button
- `clickReset()` - Click reset button

**Locators:**
- `errorDisplay` - Main error container (`data-testid="error-display"`)
- `retryButton` - Retry action button (`data-testid="retry-button"`)
- `resetButton` - Reset action button (`data-testid="reset-button"`)

## Usage Example

```typescript
import { test, expect } from "@playwright/test";
import { GenerationPage, ReviewPage, SuccessPage } from "./pages";

test("complete flashcard generation flow", async ({ page }) => {
  // Initialize page objects
  const generationPage = new GenerationPage(page);
  const reviewPage = new ReviewPage(page);
  const successPage = new SuccessPage(page);

  // Navigate and generate
  await generationPage.goto();
  await generationPage.generateFlashcards("Sample notes...");

  // Review and save
  await reviewPage.saveFlashcardSet("My Flashcard Set");

  // Verify success
  await successPage.waitForSuccess();
  expect(await successPage.isVisible()).toBe(true);
});
```

## Best Practices

1. **Encapsulation**: Keep all selectors and page interactions within the page object
2. **Abstraction**: Provide high-level methods that represent user workflows
3. **Reusability**: Create helper methods for common operations
4. **Maintainability**: When UI changes, update only the page object, not all tests
5. **Clarity**: Use descriptive method names that clearly indicate the action
6. **Wait Strategies**: Include appropriate waits in page object methods
7. **Type Safety**: Leverage TypeScript for better IDE support and error prevention

## Testing Strategy

- **Happy Path**: Test complete user flows from start to finish
- **Edge Cases**: Test validation, empty states, and error conditions
- **Interactions**: Test individual component behaviors (edit, delete, flag)
- **Navigation**: Test transitions between different states/pages
- **Accessibility**: Use semantic selectors and ARIA attributes where possible

## Related Files

- Test specifications: `tests/e2e/*.spec.ts`
- Playwright config: `playwright.config.ts`
- Component data-testids: `src/components/views/*.tsx`

