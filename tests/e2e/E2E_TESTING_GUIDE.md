# E2E Testing Guide - Flashcard Generation

## 📋 Overview

This guide covers the E2E testing setup for the flashcard generation flow using Playwright and the Page Object Model (POM) pattern.

## 🏗️ Project Structure

```
tests/e2e/
├── pages/                          # Page Object Model classes
│   ├── GenerationPage.ts          # Generation form page
│   ├── ReviewPage.ts              # Review and edit page
│   ├── SuccessPage.ts             # Success confirmation page
│   ├── ErrorPage.ts               # Error handling page
│   ├── index.ts                   # Central exports
│   └── README.md                  # POM documentation
├── fixtures/                       # Test data fixtures
│   └── test-data.ts               # Sample data and constants
├── helpers/                        # Test helper functions
│   ├── test-helpers.ts            # Utility functions
│   └── index.ts                   # Helper exports
├── flashcard-generation.spec.ts   # Main test suite
└── E2E_TESTING_GUIDE.md           # This file
```

## 🎯 Test Scenario Coverage

### Main Flow Test
Tests the complete user journey:
1. Navigate to `/generate`
2. Fill text input with notes
3. Verify character counter
4. Click "Generate flashcards"
5. Wait for AI generation
6. Review flashcard proposals
7. Set flashcard set name
8. Save the set
9. Verify success screen

### Component Interaction Tests
- **Editing flashcards**: Edit avers and rewers content
- **Flagging flashcards**: Mark flashcards as low quality
- **Deleting flashcards**: Remove unwanted proposals
- **Validation**: Test form validation rules

### Navigation Tests
- Navigate from success back to generation form
- Button enabled/disabled states
- URL verification

## 🏷️ Data-testid Reference

### Generation Form
- `generation-text-input` - Main text input field
- `character-counter` - Character count display
- `generate-flashcards-button` - Generate button

### Review Section
- `flashcard-proposals-list` - Container for all proposals
- `flashcard-proposal-item` - Individual flashcard
- `flashcard-avers` - Front of flashcard (view mode)
- `flashcard-rewers` - Back of flashcard (view mode)
- `edit-flashcard-button` - Edit button
- `flag-flashcard-button` - Flag button
- `delete-flashcard-button` - Delete button
- `edit-flashcard-avers-input` - Avers input (edit mode)
- `edit-flashcard-rewers-input` - Rewers input (edit mode)
- `save-edit-flashcard-button` - Save edit button
- `cancel-edit-flashcard-button` - Cancel edit button
- `set-name-input` - Set name input field
- `save-flashcard-set-button` - Save set button

### Success Screen
- `success-display` - Main success container
- `start-learning-button` - Link to learning mode
- `generate-another-set-button` - Return to generation
- `view-all-sets-button` - View all sets link

### Error Screen
- `error-display` - Error container
- `retry-button` - Retry action
- `reset-button` - Reset to initial state

### Loading State
- `loading-spinner` - Loading spinner container
- `loading-message` - Loading message text

## 🧪 Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test flashcard-generation.spec.ts

# Run specific test by name
npx playwright test -g "should complete the full"
```

### Debugging

```bash
# Generate test code interactively
npx playwright codegen http://localhost:4321/generate

# Show test report
npm run test:e2e:report

# View trace for failed test
npx playwright show-trace trace.zip
```

## 📝 Writing New Tests

### 1. Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { GenerationPage } from "./pages";

test.describe("My Feature", () => {
  let generationPage: GenerationPage;

  test.beforeEach(async ({ page }) => {
    generationPage = new GenerationPage(page);
    await generationPage.goto();
  });

  test("should do something", async () => {
    // Your test code here
  });
});
```

### 2. Using Page Objects

```typescript
// Good: Use high-level methods
await generationPage.generateFlashcards("Sample text");

// Avoid: Direct element manipulation
await page.getByTestId("generation-text-input").fill("Sample text");
await page.getByTestId("generate-flashcards-button").click();
```

### 3. Using Test Data

```typescript
import { SAMPLE_NOTES, SET_NAMES } from "./fixtures/test-data";

// Use predefined test data
await generationPage.fillText(SAMPLE_NOTES.LONG);
await reviewPage.setFlashcardSetName(SET_NAMES.HISTORY);
```

### 4. Using Helpers

```typescript
import { waitForNetworkIdle, verifyUrl } from "./helpers";

await waitForNetworkIdle(page);
await verifyUrl(page, /\/generate/);
```

## 🎨 Best Practices

### DO ✅
- **Use Page Object Model** - All interactions through POM classes
- **Use data-testid** - Stable selectors that don't change with styling
- **Use test fixtures** - Reusable test data from `fixtures/test-data.ts`
- **Use helper functions** - Common operations in `helpers/test-helpers.ts`
- **Wait appropriately** - Use built-in Playwright waits, not arbitrary timeouts
- **Test user flows** - Focus on complete user journeys
- **Name tests descriptively** - Clear test names that explain what's being tested

### DON'T ❌
- **Don't use CSS selectors directly** - Use `data-testid` instead
- **Don't use arbitrary timeouts** - Use Playwright's auto-waiting
- **Don't duplicate code** - Extract common operations to page objects
- **Don't test implementation details** - Test from user's perspective
- **Don't skip error cases** - Test both happy and error paths

## 🔍 Troubleshooting

### Tests are flaky
- Check if you're using proper waits (not `waitForTimeout`)
- Ensure elements are stable before interaction
- Use `waitFor({ state: 'stable' })` for animated elements

### Can't find element
- Verify `data-testid` attribute exists in component
- Check if element is hidden or disabled
- Use debug mode to inspect the page state

### Slow test execution
- Use `fullyParallel: true` in config (already set)
- Mock API calls when appropriate
- Avoid unnecessary waits

### TypeScript errors
- Ensure all page objects are properly typed
- Import types from Playwright: `import { Page, Locator } from "@playwright/test"`
- Check that all methods return appropriate types

## 📊 Test Coverage

Current test coverage includes:
- ✅ Full generation flow (happy path)
- ✅ Flashcard editing
- ✅ Flashcard flagging
- ✅ Flashcard deletion
- ✅ Form validation
- ✅ Navigation flows
- ⏳ Error handling (requires API mocking setup)
- ⏳ Network failure scenarios
- ⏳ Timeout handling

## 🚀 Next Steps

1. **Add API mocking** - Mock backend responses for consistent tests
2. **Add visual regression tests** - Use `toHaveScreenshot()` for UI testing
3. **Add accessibility tests** - Integrate axe-core for a11y testing
4. **Add performance tests** - Monitor page load and generation times
5. **Add mobile tests** - Test responsive design on mobile viewports

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Best Practices](https://playwright.dev/docs/pom)
- [Playwright Test Generator](https://playwright.dev/docs/codegen)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Playwright Inspector](https://playwright.dev/docs/debug)

## 🤝 Contributing

When adding new features:
1. Add appropriate `data-testid` attributes to components
2. Create or update POM classes in `tests/e2e/pages/`
3. Add test data to `tests/e2e/fixtures/test-data.ts`
4. Write comprehensive test cases
5. Update this documentation

## 📞 Support

For questions or issues:
- Check the [Playwright Documentation](https://playwright.dev/)
- Review existing test examples in `tests/e2e/`
- Consult the POM documentation in `tests/e2e/pages/README.md`

