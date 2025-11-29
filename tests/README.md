# Testing Guide

Ten dokument opisuje środowisko testowe i najlepsze praktyki testowania w projekcie.

## Struktura katalogów

```
tests/
├── setup/           # Pliki konfiguracyjne testów
├── unit/            # Testy jednostkowe
├── integration/     # Testy integracyjne
├── e2e/             # Testy End-to-End (Playwright)
│   ├── pages/       # Page Object Model classes
│   └── *.spec.ts    # Specyfikacje testów E2E
├── mocks/           # Mock Service Worker (MSW) handlers
└── README.md        # Ten plik
```

## Tech Stack Testowy

- **Vitest** - Framework do testów jednostkowych i integracyjnych
- **React Testing Library** - Testowanie komponentów React
- **Playwright** - Testy End-to-End
- **MSW (Mock Service Worker)** - Mockowanie API
- **jsdom** - Środowisko DOM dla testów

## Uruchamianie testów

### Testy jednostkowe i integracyjne (Vitest)

```bash
# Uruchom wszystkie testy w trybie watch
npm run test

# Uruchom testy jeden raz
npm run test:run

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy z pokryciem kodu
npm run test:coverage

# Uruchom testy w trybie watch
npm run test:watch
```

### Testy E2E (Playwright)

```bash
# Uruchom testy E2E
npm run test:e2e

# Uruchom testy E2E z interfejsem UI
npm run test:e2e:ui

# Uruchom testy E2E w trybie debug
npm run test:e2e:debug

# Wyświetl raport z testów E2E
npm run test:e2e:report
```

## Konwencje nazewnictwa

- **Testy jednostkowe i integracyjne**: `*.test.ts` lub `*.test.tsx`
- **Testy E2E**: `*.spec.ts`

## Struktura testów jednostkowych

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## Struktura testów komponentów

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
  
  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<ComponentName />);
    
    await user.click(screen.getByRole('button'));
    
    expect(screen.getByText('Updated text')).toBeInTheDocument();
  });
});
```

## Struktura testów E2E

### Podstawowa struktura

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform user flow', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/success/);
  });
});
```

### Użycie Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { GenerationPage, ReviewPage, SuccessPage } from './pages';

test.describe('Flashcard Generation Flow', () => {
  let generationPage: GenerationPage;
  let reviewPage: ReviewPage;
  let successPage: SuccessPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    generationPage = new GenerationPage(page);
    reviewPage = new ReviewPage(page);
    successPage = new SuccessPage(page);
    
    // Navigate to starting page
    await generationPage.goto();
  });

  test('should complete full flow', async () => {
    // Step 1: Generate flashcards
    await generationPage.generateFlashcards("Sample notes...");
    
    // Step 2: Review and save
    await reviewPage.saveFlashcardSet("My Set");
    
    // Step 3: Verify success
    await successPage.waitForSuccess();
    expect(await successPage.isVisible()).toBe(true);
  });
});
```

### Page Object Model Classes

Projekt wykorzystuje wzorzec Page Object Model (POM) dla lepszej maintainability testów E2E. Wszystkie klasy POM znajdują się w `tests/e2e/pages/`:

- **GenerationPage** - Strona generowania fiszek
- **ReviewPage** - Strona przeglądu i edycji propozycji
- **SuccessPage** - Strona potwierdzenia sukcesu
- **ErrorPage** - Strona obsługi błędów

Szczegółowa dokumentacja klas POM znajduje się w `tests/e2e/pages/README.md`.

## Mockowanie API z MSW

1. Dodaj handlery w `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe' },
    ]);
  }),
];
```

2. Serwer MSW jest automatycznie uruchamiany w testach integracyjnych.

## Dobre praktyki

### Vitest

- Używaj `vi.fn()` do mockowania funkcji
- Używaj `vi.spyOn()` do monitorowania istniejących funkcji
- Twórz pliki setup dla wielokrotnie używanej konfiguracji
- Używaj inline snapshots dla czytelnych asercji
- Strukturuj testy według wzorca Arrange-Act-Assert
- Wykorzystuj TypeScript do sprawdzania typów w testach

### Playwright

- **Używaj Page Object Model** - Wszystkie interakcje z UI powinny być enkapsulowane w klasach POM
- **Preferuj data-testid** - Używaj `data-testid` dla stabilnych selektorów niezależnych od zmian UI
- **Lokatory według ról** - Gdy to możliwe, używaj selektorów semantycznych (`getByRole`, `getByLabel`)
- **Browser contexts** - Wykorzystuj konteksty do izolacji testów
- **Codegen tool** - Używaj `npx playwright codegen` do generowania podstawowych testów
- **Trace viewer** - Analizuj błędy za pomocą `npx playwright show-trace`
- **Hooks dla setup** - Implementuj `beforeEach` do inicjalizacji obiektów stron
- **Wait strategies** - Wykorzystuj wbudowane mechanizmy oczekiwania Playwright
- **Parallel execution** - Testy są uruchamiane równolegle dla szybszych wyników

## Pokrycie kodu

Aby wygenerować raport pokrycia kodu:

```bash
npm run test:coverage
```

Raport zostanie wygenerowany w katalogu `coverage/`.

## Debugowanie testów

### Vitest

```bash
# Uruchom tylko określony test
npm run test -- -t "nazwa testu"

# Uruchom testy z określonego pliku
npm run test -- path/to/test.test.ts
```

### Playwright

```bash
# Tryb debug
npm run test:e2e:debug

# UI mode
npm run test:e2e:ui
```

## CI/CD

Testy są skonfigurowane do uruchamiania w CI/CD pipeline poprzez GitHub Actions. Wszystkie testy muszą przejść przed mergem do main branch.

## Dodatkowe zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

