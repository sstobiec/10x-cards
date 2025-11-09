# GenerationView - Dokumentacja

## Przegląd

Widok `GenerationView` to centralny komponent aplikacji odpowiedzialny za generowanie fiszek z tekstu przy użyciu AI. Umożliwia użytkownikom:
- Wprowadzenie tekstu (notatek, materiałów do nauki)
- Wygenerowanie propozycji fiszek przez AI
- Przeglądanie, edycję i usuwanie propozycji
- Zapisanie jako nowy zestaw fiszek

## Struktura komponentów

```
GenerationView (główny orkiestrator)
├── GenerationForm (formularz wejściowy)
├── LoadingSpinner (wskaźnik ładowania)
├── ErrorDisplay (wyświetlanie błędów)
├── ReviewSection (sekcja recenzji)
│   ├── Input (nazwa zestawu)
│   └── FlashcardProposalList
│       └── FlashcardProposalItem[] (edytowalne propozycje)
└── SuccessDisplay (potwierdzenie sukcesu)
```

## Maszyna stanów

```
idle → generating → reviewing → saving → success
  ↓         ↓          ↓          ↓
  └─────→ error ←──────┴──────────┘
```

### Stany:
- **idle**: Stan początkowy, użytkownik wprowadza tekst
- **generating**: AI generuje propozycje fiszek
- **reviewing**: Użytkownik przegląda i edytuje propozycje
- **saving**: Zapisywanie zestawu do bazy danych
- **success**: Zestaw został pomyślnie zapisany
- **error**: Wystąpił błąd (może nastąpić w każdym stanie)

## Komponenty

### GenerationView
**Ścieżka**: `src/components/views/GenerationView.tsx`

Główny komponent-orkiestrator zarządzający całym przepływem. Renderuje odpowiednie komponenty w zależności od stanu.

**Używa hooka**: `useGeneration`

---

### GenerationForm
**Ścieżka**: `src/components/views/GenerationForm.tsx`

Formularz do wprowadzania tekstu przez użytkownika.

**Funkcje**:
- Walidacja długości tekstu (max 10 000 znaków)
- Licznik znaków z wizualnym feedbackiem
- Przycisk "Generuj fiszki" z animacją ładowania

**Props**:
```typescript
interface GenerationFormProps {
  text: string;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}
```

---

### ReviewSection
**Ścieżka**: `src/components/views/ReviewSection.tsx`

Sekcja do przeglądania i edycji wygenerowanych propozycji.

**Funkcje**:
- Pole na nazwę zestawu (max 100 znaków)
- Lista wszystkich propozycji fiszek
- Przycisk "Zapisz zestaw"

**Props**:
```typescript
interface ReviewSectionProps {
  proposals: FlashcardProposalViewModel[];
  setName: string;
  onSetNameChange: (name: string) => void;
  onSave: () => void;
  onUpdateProposal: (id: string, avers: string, rewers: string) => void;
  onDeleteProposal: (id: string) => void;
  onToggleFlag: (id: string) => void;
  isSaving: boolean;
}
```

---

### FlashcardProposalItem
**Ścieżka**: `src/components/views/FlashcardProposalItem.tsx`

Pojedyncza propozycja fiszki z trybem wyświetlania i edycji.

**Tryby**:
1. **Tryb wyświetlania**: Pokazuje awers i rewers z przyciskami akcji
2. **Tryb edycji**: Edytowalne pola z walidacją

**Funkcje**:
- Edycja treści (Awers max 200 znaków, Rewers max 750 znaków)
- Usuwanie propozycji
- Oflagowanie jako słaba jakość
- Automatyczne oznaczanie jako "ai-edited" po modyfikacji

**Props**:
```typescript
interface FlashcardProposalItemProps {
  proposal: FlashcardProposalViewModel;
  onUpdate: (id: string, avers: string, rewers: string) => void;
  onDelete: (id: string) => void;
  onToggleFlag: (id: string) => void;
}
```

---

### SuccessDisplay
**Ścieżka**: `src/components/views/SuccessDisplay.tsx`

Wyświetla potwierdzenie po pomyślnym zapisaniu zestawu.

**Funkcje**:
- Szczegóły zapisanego zestawu
- Przyciski nawigacyjne:
  - "Rozpocznij naukę" - przejście do zestawu
  - "Generuj kolejny zestaw" - reset do stanu idle
  - "Zobacz wszystkie zestawy" - przejście do listy zestawów

**Props**:
```typescript
interface SuccessDisplayProps {
  savedSetInfo: CreateFlashcardSetResponseDTO;
  onReset: () => void;
}
```

---

### ErrorDisplay
**Ścieżka**: `src/components/views/ErrorDisplay.tsx`

Wyświetla błędy w sposób przyjazny dla użytkownika.

**Funkcje**:
- Wyświetlanie tytułu i komunikatu błędu
- Opcjonalne szczegóły techniczne (rozwijane)
- Przyciski akcji: "Spróbuj ponownie" i "Zacznij od nowa"

**Props**:
```typescript
interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
  onReset?: () => void;
}
```

---

### LoadingSpinner
**Ścieżka**: `src/components/views/LoadingSpinner.tsx`

Animowany spinner z komunikatem.

**Props**:
```typescript
interface LoadingSpinnerProps {
  message?: string;
}
```

---

## Hook: useGeneration

**Ścieżka**: `src/components/views/hooks/useGeneration.ts`

Custom hook zarządzający całą logiką widoku generowania.

### Stan zarządzany przez hook:
```typescript
{
  state: GenerationViewState;
  text: string;
  setName: string;
  proposals: FlashcardProposalViewModel[];
  error: ApiError | null;
  savedSetInfo: CreateFlashcardSetResponseDTO | null;
}
```

### Funkcje:
- `generateProposals()` - Generuje propozycje fiszek z API
- `saveFlashcardSet()` - Zapisuje zestaw fiszek do bazy
- `updateProposal(id, avers, rewers)` - Aktualizuje propozycję
- `deleteProposal(id)` - Usuwa propozycję
- `toggleFlag(id)` - Przełącza status oflagowania
- `reset()` - Resetuje hook do stanu początkowego

### Integracja z API:

#### 1. Generowanie fiszek
```
POST /api/flashcards/generate
Body: GenerateFlashcardsRequestDTO
Response: GenerateFlashcardsResponseDTO
```

#### 2. Zapisywanie zestawu
```
POST /api/flashcard-sets
Body: CreateFlashcardSetRequestDTO
Response: CreateFlashcardSetResponseDTO
```

---

## Typy

### GenerationViewState
```typescript
type GenerationViewState = 
  | 'idle'
  | 'generating'
  | 'reviewing'
  | 'saving'
  | 'success'
  | 'error';
```

### FlashcardProposalViewModel
```typescript
interface FlashcardProposalViewModel {
  id: string;                      // UUID po stronie klienta
  avers: string;                   // Pytanie
  rewers: string;                  // Odpowiedź
  source: 'ai-full' | 'ai-edited'; // Źródło
  isFlagged: boolean;              // Czy oflagowana
}
```

### ApiError
```typescript
interface ApiError {
  title: string;
  message: string;
  details?: Record<string, unknown>;
}
```

---

## Walidacja

### GenerationForm:
- Tekst nie może być pusty
- Maksymalnie 10 000 znaków

### ReviewSection:
- Nazwa zestawu nie może być pusta
- Maksymalnie 100 znaków
- Musi być co najmniej jedna propozycja do zapisania

### FlashcardProposalItem (edycja):
- Awers: nie pusty, max 200 znaków
- Rewers: nie pusty, max 750 znaków

---

## Accessibility

Wszystkie komponenty zostały zaimplementowane z uwzględnieniem accessibility:
- Odpowiednie `aria-label`, `aria-live`, `aria-busy`
- Semantyczny HTML (button, form, label)
- Nawigacja klawiaturą
- Role dla dynamicznych treści

---

## Responsywność

Komponenty są w pełni responsywne z użyciem Tailwind breakpoints:
- `sm:` - małe ekrany (640px+)
- Flex layouty adaptujące się do rozmiaru ekranu
- Przyciski i kontrolki responsywne

---

## Użycie

### W stronie Astro:
```astro
---
import Layout from "@/layouts/Layout.astro";
import { GenerationView } from "@/components/views";

export const prerender = false;
---

<Layout title="Generuj fiszki">
  <GenerationView client:load />
</Layout>
```

### Standalone (w aplikacji React):
```tsx
import { GenerationView } from "@/components/views";

function App() {
  return <GenerationView />;
}
```

---

## Testowanie

### Przepływ testowy:
1. Wpisz tekst (max 10 000 znaków)
2. Kliknij "Generuj fiszki"
3. Poczekaj na wygenerowanie (loading)
4. Przejrzyj propozycje
5. Edytuj/usuń/oflaguj propozycje
6. Wpisz nazwę zestawu
7. Kliknij "Zapisz zestaw"
8. Sprawdź potwierdzenie sukcesu

### Przypadki brzegowe:
- Pusty tekst
- Tekst przekraczający limit
- Brak propozycji do zapisania
- Pusta nazwa zestawu
- Błędy API (404, 500, 503)
- Konflikt nazwy (409)

---

## Znane ograniczenia

- Brak autosave dla propozycji
- Brak możliwości dodania własnych fiszek w trakcie recenzji
- Brak podglądu w trybie nauki przed zapisaniem

---

## Przyszłe usprawnienia

- [ ] Dodać autosave stanu w localStorage
- [ ] Dodać możliwość dodania własnych fiszek
- [ ] Dodać preview w trybie nauki
- [ ] Dodać eksport do PDF/CSV
- [ ] Dodać historię generowania
- [ ] Dodać statystyki jakości wygenerowanych fiszek

