# Plan implementacji widoku GenerationView

## 1. Przegląd

Widok `GenerationView` stanowi centralny punkt aplikacji do generowania fiszek z tekstu przy użyciu AI. Umożliwia użytkownikom wklejenie notatek, zainicjowanie procesu generowania, a następnie przeglądanie, edytowanie i zapisywanie propozycji fiszek jako nowy, spersonalizowany zestaw. Proces ten został zaprojektowany jako płynny, jednostronicowy interfejs, prowadzący użytkownika od surowego tekstu do gotowego do nauki zestawu fiszek.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/generate`. Dostęp do tej ścieżki powinien być chroniony i wymagać uwierzytelnienia użytkownika.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane w React i TypeScript, a ich stylizacja oparta będzie na Tailwind CSS i predefiniowanych komponentach z biblioteki `shadcn/ui`.

```
/src/pages/generate.astro
└── /src/components/views/GenerationView.tsx (client:load)
    ├── GenerationForm.tsx
    │   ├── Textarea (z licznikiem znaków)
    │   └── Button ("Generuj fiszki")
    ├── ReviewSection.tsx
    │   ├── Input ("Nazwa zestawu")
    │   ├── FlashcardProposalList.tsx
    │   │   └── FlashcardProposalItem.tsx[]
    │   │       ├── Input/Textarea (Awers/Rewers)
    │   │       └── Przyciski (Edytuj, Usuń, Oflaguj)
    │   └── Button ("Zapisz zestaw")
    ├── SuccessDisplay.tsx
    │   └── Przyciski nawigacyjne
    ├── LoadingSpinner.tsx
    └── ErrorDisplay.tsx
```

## 4. Szczegóły komponentów

### `GenerationView.tsx`
- **Opis komponentu**: Główny komponent-kontener, który zarządza całym stanem i logiką przepływu generowania fiszek. Renderuje odpowiednie komponenty podrzędne w zależności od aktualnego etapu procesu (np. wprowadzanie tekstu, ładowanie, recenzja, sukces, błąd).
- **Główne elementy**: Komponenty `GenerationForm`, `ReviewSection`, `SuccessDisplay`, `LoadingSpinner`, `ErrorDisplay`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji; orkiestruje stanem na podstawie zdarzeń z komponentów podrzędnych.
- **Typy**: `GenerationViewState`, `FlashcardProposalViewModel[]`, `ApiError`.
- **Propsy**: Brak.

### `GenerationForm.tsx`
- **Opis komponentu**: Odpowiada za zbieranie danych wejściowych od użytkownika. Zawiera pole tekstowe na notatki oraz przycisk inicjujący generowanie.
- **Główne elementy**: `Textarea`, `Button` (z `shadcn/ui`), dynamiczny licznik znaków.
- **Obsługiwane interakcje**: `onSubmit` formularza, `onChange` pola tekstowego.
- **Obsługiwana walidacja**:
  - Tekst wejściowy nie może być pusty.
  - Tekst wejściowy nie może przekraczać 10 000 znaków.
- **Typy**: `string` dla tekstu.
- **Propsy**:
  - `text: string`
  - `onTextChange: (text: string) => void`
  - `onGenerate: () => void`
  - `isLoading: boolean`

### `ReviewSection.tsx`
- **Opis komponentu**: Pojawia się po pomyślnym wygenerowaniu fiszek. Umożliwia użytkownikowi nazwanie zestawu, przegląd i edycję propozycji oraz finalne zapisanie zestawu.
- **Główne elementy**: `Input` (dla nazwy zestawu), komponent `FlashcardProposalList`, `Button` ("Zapisz zestaw").
- **Obsługiwane interakcje**: `onSubmit` formularza zapisu.
- **Obsługiwana walidacja**:
  - Nazwa zestawu nie może być pusta.
  - Nazwa zestawu nie może przekraczać 100 znaków.
- **Typy**: `FlashcardProposalViewModel[]`.
- **Propsy**:
  - `proposals: FlashcardProposalViewModel[]`
  - `setName: string`
  - `onSetNameChange: (name: string) => void`
  - `onSave: () => void`
  - `onUpdateProposal: (id: string, avers: string, rewers: string) => void`
  - `onDeleteProposal: (id: string) => void`
  - `onToggleFlag: (id: string) => void`
  - `isSaving: boolean`

### `FlashcardProposalItem.tsx`
- **Opis komponentu**: Reprezentuje pojedynczą, edytowalną propozycję fiszki na liście recenzji. Posiada tryb wyświetlania i edycji.
- **Główne elementy**: Pola tekstowe (`Input`/`Textarea`) dla awersu i rewersu, przyciski akcji (Edytuj, Zapisz, Anuluj, Usuń, Oflaguj).
- **Obsługiwane interakcje**: Edycja, usuwanie, oflagowanie fiszki.
- **Obsługiwana walidacja**:
  - Awers nie może być pusty i nie może przekraczać 200 znaków.
  - Rewers nie może być pusty i nie może przekraczać 750 znaków.
- **Typy**: `FlashcardProposalViewModel`.
- **Propsy**:
  - `proposal: FlashcardProposalViewModel`
  - `onUpdate: (id: string, avers: string, rewers: string) => void`
  - `onDelete: (id: string) => void`
  - `onToggleFlag: (id: string) => void`

## 5. Typy

Do implementacji widoku, oprócz istniejących DTO, potrzebne będą następujące typy `ViewModel`.

```typescript
// Typ reprezentujący ogólny stan widoku
export type GenerationViewState = 
  | 'idle'      // Stan początkowy
  | 'generating'// Trwa generowanie fiszek
  | 'reviewing' // Użytkownik przegląda i edytuje propozycje
  | 'saving'    // Trwa zapisywanie zestawu
  | 'success'   // Zestaw pomyślnie zapisany
  | 'error';    // Wystąpił błąd

// Typ reprezentujący propozycję fiszki w stanie UI
export interface FlashcardProposalViewModel {
  // Unikalny identyfikator po stronie klienta (np. uuidv4)
  id: string; 
  // Awers fiszki (pytanie)
  avers: string; 
  // Rewers fiszki (odpowiedź)
  rewers: string;
  // Źródło pochodzenia fiszki
  source: 'ai-full' | 'ai-edited'; 
  // Czy fiszka została oflagowana jako słaba jakość
  isFlagged: boolean; 
}

// Typ reprezentujący błąd API do wyświetlenia w UI
export interface ApiError {
  title: string;
  message: string;
  details?: Record<string, unknown>;
}

// Rozszerzenie DTO o pole 'flagged' zgodnie z historyjką US-006
export interface FlashcardCreateCommand {
  avers: string;
  rewers: string;
  source: FlashcardSource;
  flagged: boolean; // Dodane pole
}
```

## 6. Zarządzanie stanem

Cała logika i stan widoku zostaną zamknięte w niestandardowym hooku `useGeneration`. Takie podejście zapewni separację logiki od prezentacji i ułatwi testowanie.

**Hook `useGeneration` będzie zarządzał:**
- `state: GenerationViewState`: Aktualny stan maszyny stanów widoku.
- `text: string`: Treść notatek wprowadzonych przez użytkownika.
- `setName: string`: Nazwa tworzonego zestawu.
- `proposals: FlashcardProposalViewModel[]`: Lista propozycji fiszek.
- `error: ApiError | null`: Obiekt błędu, jeśli wystąpi.
- `savedSetInfo: CreateFlashcardSetResponseDTO | null`: Informacje o zapisanym zestawie.

**Hook `useGeneration` będzie udostępniał funkcje:**
- `generateProposals()`: Wysyła żądanie do API w celu wygenerowania fiszek.
- `saveFlashcardSet()`: Wysyła żądanie do API w celu zapisania zestawu.
- `updateProposal()`: Aktualizuje treść propozycji w stanie.
- `deleteProposal()`: Usuwa propozycję ze stanu.
- `toggleFlag()`: Zmienia status oflagowania propozycji.
- `reset()`: Przywraca stan hooka do wartości początkowych.

## 7. Integracja API

Integracja z backendem będzie opierać się na dwóch głównych endpointach:

1.  **Generowanie propozycji fiszek**
    - **Endpoint:** `POST /api/flashcards/generate`
    - **Typ żądania:** `GenerateFlashcardsRequestDTO`
    - **Typ odpowiedzi (sukces):** `GenerateFlashcardsResponseDTO`
    - **Akcja:** Wywoływane po kliknięciu "Generuj fiszki". Wynik jest mapowany na `FlashcardProposalViewModel[]` i zapisywany w stanie.

2.  **Zapisywanie nowego zestawu fiszek**
    - **Endpoint:** `POST /api/flashcard-sets`
    - **Typ żądania:** `CreateFlashcardSetRequestDTO` (zbudowany na podstawie stanu: `setName`, `proposals` i metadanych z poprzedniego zapytania)
    - **Typ odpowiedzi (sukces):** `CreateFlashcardSetResponseDTO`
    - **Akcja:** Wywoływane po kliknięciu "Zapisz zestaw". Po sukcesie widok przechodzi w stan `success`.

## 8. Interakcje użytkownika

- **Wpisywanie tekstu**: Aktualizuje stan `text`, przelicza licznik znaków i włącza/wyłącza przycisk "Generuj".
- **Kliknięcie "Generuj fiszki"**: Uruchamia funkcję `generateProposals`, blokuje interfejs i wyświetla wskaźnik ładowania.
- **Wpisywanie nazwy zestawu**: Aktualizuje stan `setName` i włącza/wyłącza przycisk "Zapisz zestaw".
- **Edycja propozycji fiszki**: Komponent `FlashcardProposalItem` przechodzi w tryb edycji, umożliwiając modyfikację. Zapisanie zmian wywołuje `updateProposal`.
- **Usuwanie propozycji**: Kliknięcie przycisku usuwania wywołuje `deleteProposal` i usuwa element z listy.
- **Kliknięcie "Zapisz zestaw"**: Uruchamia `saveFlashcardSet`, blokuje interfejs i wyświetla wskaźnik ładowania.
- **Nawigacja po sukcesie**: Kliknięcie przycisków w `SuccessDisplay` przekierowuje użytkownika do odpowiednich widoków (np. sesji nauki, listy zestawów).

## 9. Warunki i walidacja

Walidacja będzie realizowana na poziomie komponentów, aby zapewnić natychmiastową informację zwrotną dla użytkownika, zanim żądanie zostanie wysłane do API.

- **`GenerationForm`**:
  - Przycisk "Generuj" jest nieaktywny, jeśli pole tekstowe jest puste, przekracza 10 000 znaków lub trwa proces generowania.
  - Licznik znaków zmienia kolor na czerwony po przekroczeniu limitu.
- **`ReviewSection`**:
  - Przycisk "Zapisz zestaw" jest nieaktywny, jeśli nazwa zestawu jest pusta, przekracza 100 znaków lub trwa proces zapisywania.
- **`FlashcardProposalItem` (tryb edycji)**:
  - Przycisk zapisu zmian jest nieaktywny, jeśli pole awersu/rewersu jest puste lub przekracza zdefiniowane limity (200/750 znaków).

## 10. Obsługa błędów

Komponent `ErrorDisplay` będzie wyświetlał błędy w sposób przyjazny dla użytkownika.

- **Błędy walidacji (400, 422)**: Komunikaty powinny wskazywać, które pole jest nieprawidłowe. Walidacja po stronie klienta powinna minimalizować występowanie tych błędów.
- **Konflikt nazwy (409)**: Należy wyświetlić komunikat: "Zestaw o tej nazwie już istnieje."
- **Niedostępność usługi AI (503)**: Należy wyświetlić komunikat: "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie później."
- **Błędy serwera (500)**: Należy wyświetlić ogólny komunikat o błędzie i zachęcić do ponownej próby.
- **Błędy sieciowe**: Należy obsłużyć błędy połączenia (np. przez `try-catch` na `fetch`) i poinformować o problemie z siecią.

Każdy komunikat o błędzie powinien zawierać przycisk "Spróbuj ponownie" lub "Zacznij od nowa", który wywołuje odpowiednią akcję (np. `generateProposals` lub `reset`).

## 11. Kroki implementacji

1.  **Struktura plików**: Utworzenie plików dla wszystkich zdefiniowanych komponentów (`GenerationView.tsx`, `GenerationForm.tsx`, itd.) w katalogu `/src/components/views/` lub podobnym. Utworzenie strony `/src/pages/generate.astro` i osadzenie w niej `GenerationView.tsx` z dyrektywą `client:load`.
2.  **Typy i hook**: Zdefiniowanie typów `ViewModel` i `GenerationViewState`. Implementacja szkieletu hooka `useGeneration` z całym stanem i pustymi funkcjami.
3.  **Komponent `GenerationForm`**: Implementacja interfejsu użytkownika do wprowadzania tekstu, włącznie z licznikiem znaków i logiką walidacji. Podłączenie do stanu i akcji z hooka `useGeneration`.
4.  **Integracja z API generowania**: Implementacja funkcji `generateProposals` w hooku, włącznie z obsługą stanów ładowania i błędów.
5.  **Komponenty `ReviewSection` i `FlashcardProposalList/Item`**: Implementacja interfejsu do wyświetlania, edycji, usuwania i oflagowania propozycji fiszek. Na początku można zaimplementować tylko tryb wyświetlania.
6.  **Logika edycji**: Implementacja pełnej logiki w `FlashcardProposalItem` (przełączanie trybów, walidacja) oraz funkcji `updateProposal`, `deleteProposal`, `toggleFlag` w hooku.
7.  **Integracja z API zapisu**: Implementacja funkcji `saveFlashcardSet` w hooku, włącznie z transformacją danych z `ViewModel` do `DTO` oraz obsługą stanów zapisu i błędów.
8.  **Komponenty `SuccessDisplay`, `ErrorDisplay`, `LoadingSpinner`**: Implementacja komponentów pomocniczych do informowania użytkownika o stanie aplikacji.
9.  **Finalne połączenie**: Połączenie wszystkich komponentów w `GenerationView` i upewnienie się, że stan jest poprawnie przekazywany i aktualizowany w całym przepływie.
10. **Testowanie**: Przetestowanie całego przepływu, włączając w to przypadki brzegowe i obsługę błędów.
