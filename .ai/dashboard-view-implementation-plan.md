# Plan implementacji widoku Pulpitu (DashboardView)

## 1. Przegląd

Widok Pulpitu (`DashboardView`) stanowi centralny punkt aplikacji dla zalogowanego użytkownika. Jego głównym celem jest umożliwienie zarządzania zestawami fiszek (tworzenie, przeglądanie, edycja, usuwanie) oraz szybkie przejście do trybu nauki. Widok obsługuje paginację oraz stany ładowania, błędu i pustej listy.

## 2. Routing widoku

- **Ścieżka:** `/dashboard`
- **Dostęp:** Tylko dla zalogowanych użytkowników (chronione przez middleware/weryfikację sesji w Astro).

## 3. Struktura komponentów

```text
src/pages/dashboard.astro (Strona Astro - entry point)
└── BaseLayout (Layout aplikacji)
    └── DashboardContainer (Komponent React - client-only)
        ├── DashboardHeader (Tytuł + Przyciski akcji głównych)
        │   └── CreateSetDialog (Modal tworzenia manualnego)
        ├── DashboardContent (Obszar główny)
        │   ├── DashboardSkeleton (Stan ładowania)
        │   ├── EmptyState (Stan braku danych)
        │   └── FlashcardSetList (Siatka zestawów)
        │       └── FlashcardSetCard (Pojedyncza karta zestawu)
        │           └── DeleteSetAlertDialog (Modal potwierdzenia usunięcia)
        └── PaginationControls (Nawigacja stronicowania)
```

## 4. Szczegóły komponentów

### `DashboardPage` (`src/pages/dashboard.astro`)

- **Opis:** Główny plik strony Astro. Weryfikuje sesję użytkownika po stronie serwera i przekazuje dane użytkownika do kontenera React.
- **Główne elementy:** `BaseLayout`, `DashboardContainer`.
- **Propsy:** Brak (pobiera `user` z `Astro.locals`).

### `DashboardContainer` (`src/components/dashboard/DashboardContainer.tsx`)

- **Opis:** Główny komponent logiki (Smart Component). Zarządza stanem pobierania zestawów, paginacją i obsługą globalnych akcji.
- **Typy:** Zarządza stanem zgodnym z `PaginatedResponseDTO<FlashcardSetListItemDTO>`.
- **Interakcje:** Inicjalne pobranie danych, obsługa zmiany strony, odświeżenie listy po usunięciu.

### `CreateSetDialog` (`src/components/dashboard/CreateSetDialog.tsx`)

- **Opis:** Modal z formularzem do tworzenia nowego, pustego zestawu manualnego.
- **Główne elementy:** `Dialog` (Shadcn), `Input`, `Button`, `Label`.
- **Walidacja:**
  - Nazwa zestawu: wymagana, min 1 znak, max 100 znaków.
- **Interakcje:** Wpisanie nazwy, wysłanie formularza, obsługa błędu (np. duplikat nazwy), przekierowanie po sukcesie.

### `FlashcardSetList` (`src/components/dashboard/FlashcardSetList.tsx`)

- **Opis:** Komponent prezentacyjny wyświetlający siatkę kart.
- **Propsy:** `sets: FlashcardSetListItemDTO[]`, `onDelete: (id: string) => Promise<void>`.

### `FlashcardSetCard` (`src/components/dashboard/FlashcardSetCard.tsx`)

- **Opis:** Karta prezentująca pojedynczy zestaw.
- **Główne elementy:** `Card` (Shadcn), `Badge` (AI/Manual), przyciski akcji (Ucz się, Edytuj, Usuń).
- **Propsy:** `set: FlashcardSetListItemDTO`, `onDelete: (id: string) => Promise<void>`.

### `DeleteSetAlertDialog` (`src/components/dashboard/DeleteSetAlertDialog.tsx`)

- **Opis:** Modal potwierdzający nieodwracalne usunięcie zestawu.
- **Główne elementy:** `AlertDialog` (Shadcn).

### `EmptyState` (`src/components/dashboard/EmptyState.tsx`)

- **Opis:** Wyświetlany, gdy użytkownik nie ma żadnych zestawów. Zawiera CTA do stworzenia pierwszego zestawu.

## 5. Typy

Wykorzystujemy istniejące typy z `src/types.ts`. Dodatkowo definiujemy typy propsów dla komponentów.

```typescript
// Import z src/types.ts
import type { FlashcardSetListItemDTO, PaginatedResponseDTO, PaginationMetaDTO } from "@/types";

// Typy lokalne (stan)
interface DashboardState {
  data: FlashcardSetListItemDTO[];
  pagination: PaginationMetaDTO;
  isLoading: boolean;
  error: string | null;
}
```

## 6. Zarządzanie stanem

Zalecane jest stworzenie custom hooka `useDashboardSets` w `src/hooks/useDashboardSets.ts` (lub wewnątrz komponentu, jeśli proste):

- **Stan:**
  - `sets`: Lista zestawów.
  - `pagination`: Metadane paginacji (limit, offset, total).
  - `isLoading`: Flaga ładowania.
  - `isCreating`: Flaga trwania operacji tworzenia.
- **Metody:**
  - `fetchSets(page: number)`: Pobiera dane dla konkretnej strony.
  - `createSet(name: string)`: Wysyła POST i przekierowuje.
  - `deleteSet(id: string)`: Wysyła DELETE i odświeża listę (zachowując stronę lub cofając jeśli pusta).

## 7. Integracja API

### Pobieranie listy zestawów

- **Endpoint:** `GET /api/flashcard-sets`
- **Query Params:** `limit=12` (domyślnie), `offset=(page-1)*limit`.
- **Oczekiwana odpowiedź:** `PaginatedResponseDTO<FlashcardSetListItemDTO>`.

### Tworzenie zestawu manualnego

- **Endpoint:** `POST /api/flashcard-sets`
- **Body:**
  ```json
  {
    "name": "Nazwa zestawu",
    "model": "manual",
    "generation_duration": 0,
    "flashcards": []
  }
  ```
- **Sukces:** Przekierowanie do `/sets/[id]/edit`.

### Usuwanie zestawu

- **Endpoint:** `DELETE /api/flashcard-sets/[id]`
- **Sukces:** Kod 204. Wymagane odświeżenie listy.

## 8. Interakcje użytkownika

1. **Wejście na stronę:** Loader -> Pobranie danych -> Wyświetlenie listy lub Empty State.
2. **Kliknięcie "Stwórz ręcznie":** Otwarcie modala -> Wpisanie nazwy -> Kliknięcie "Utwórz" -> Przekierowanie do edytora.
3. **Kliknięcie "Generuj z tekstu":** Przejście (Link) do `/generate`.
4. **Paginacja:** Kliknięcie numeru strony -> Loader -> Pobranie nowych danych.
5. **Usuwanie:** Kliknięcie ikony kosza -> Potwierdzenie w AlertDialog -> Usunięcie -> Toast sukcesu -> Odświeżenie listy.

## 9. Warunki i walidacja

- **Nazwa zestawu (CreateSetDialog):**
  - Nie może być pusta.
  - Max 100 znaków.
  - Backend zwraca 409 Conflict jeśli nazwa jest zajęta (należy wyświetlić błąd w formularzu).
- **Paginacja:**
  - Przyciski "Poprzednia"/"Następna" zablokowane na krawędziach zakresu.

## 10. Obsługa błędów

- **Błąd pobierania listy:** Wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie".
- **Błąd tworzenia:** Wyświetlenie błędu walidacji pod inputem lub Toast z błędem serwera.
- **Błąd usuwania:** Toast z informacją o niepowodzeniu, zestaw pozostaje na liście.

## 11. Kroki implementacji

1. **Setup struktury:** Utworzenie folderu `src/components/dashboard` i plików komponentów.
2. **DashboardPage:** Implementacja `src/pages/dashboard.astro` z podstawowym layoutem.
3. **Hook API:** Implementacja `useDashboardSets` z logiką fetchowania i usuwania.
4. **Komponenty UI - Karty:** Implementacja `FlashcardSetCard` i `FlashcardSetList`.
5. **Komponenty UI - Dialogi:** Implementacja `CreateSetDialog` (z logiką POST) i `DeleteSetAlertDialog`.
6. **Integracja:** Złożenie wszystkiego w `DashboardContainer`.
7. **Paginacja:** Dodanie obsługi zmiany stron i obliczania offsetu.
8. **Empty State:** Dodanie obsługi stanu pustego.
9. **Testy manualne:** Weryfikacja przepływów (CRUD, paginacja, błędy).
