# Plan implementacji widoku Edytora Zestawu (SetEditorView)

## 1. Przegląd

Widok Edytora Zestawu (`SetEditorView`) to kluczowy ekran aplikacji 10xCards, umożliwiający użytkownikom pełne zarządzanie konkretnym zestawem fiszek. Pozwala na zmianę nazwy zestawu, ręczne dodawanie nowych fiszek, a także edycję i usuwanie istniejących kart. Widok ten obsługuje zarówno zestawy stworzone ręcznie, jak i te wygenerowane przez AI.

Głównym celem jest zapewnienie płynnego, ergonomicznego procesu tworzenia materiałów edukacyjnych, z naciskiem na szybkość dodawania nowych elementów (np. obsługa klawiatury).

## 2. Routing widoku

- **Ścieżka:** `/sets/[id]`
- **Plik Astro:** `src/pages/sets/[id].astro`
- **Dostęp:** Chroniony (wymaga zalogowania). Dostęp tylko do zestawów należących do użytkownika (weryfikacja po stronie serwera/SSR).

## 3. Struktura komponentów

Hierarchia komponentów dla tego widoku wygląda następująco:

```text
src/pages/sets/[id].astro (Server Side - Data Fetching & Layout)
└── DashboardLayout
    └── SetEditor (Client Side - React Container)
        ├── SetHeader (Editable Title & Metadata)
        ├── AddFlashcardForm (Create New Card)
        └── FlashcardList (List Container)
            └── FlashcardItem (Individual Card Manager)
                ├── FlashcardDisplay (Read Mode)
                └── FlashcardEditForm (Edit Mode)
```

## 4. Szczegóły komponentów

### 1. `src/pages/sets/[id].astro`

- **Opis:** Strona Astro renderowana po stronie serwera. Odpowiada za wstępną weryfikację uprawnień i pobranie danych zestawu.
- **Odpowiedzialność:**
  - Sprawdzenie sesji użytkownika.
  - Pobranie `FlashcardSetDetailDTO` bezpośrednio z bazy danych (lub przez wewnętrzne wywołanie serwisu), aby zapewnić szybkie pierwsze wyrenderowanie (LCP).
  - Obsługa błędów 404 (zestaw nie istnieje) lub 403 (brak dostępu).
- **Propsy przekazywane do `SetEditor`:**
  - `initialData`: `FlashcardSetDetailDTO`

### 2. `SetEditor` (React Component)

- **Opis:** Główny kontener stanu. Zarządza listą fiszek i logiką biznesową.
- **Główne elementy:** `div` (wrapper), `SetHeader`, `AddFlashcardForm`, `FlashcardList`.
- **Zarządzanie stanem (hook `useSetEditor`):**
  - Przechowuje aktualny stan zestawu (zsynchronizowany z `initialData`).
  - Udostępnia funkcje: `updateSetName`, `addFlashcard`, `updateFlashcard`, `deleteFlashcard`.
  - Obsługuje globalne stany ładowania i błędów.

### 3. `SetHeader`

- **Opis:** Komponent wyświetlający nagłówek z możliwością edycji nazwy zestawu.
- **Interakcje:**
  - Kliknięcie w nazwę lub przycisk edycji zamienia tekst na `Input`.
  - Zapisanie zmiany następuje po zdarzeniu `onBlur` lub naciśnięciu `Enter`.
- **Walidacja:**
  - Nazwa: wymagana, min. 1 znak, max 100 znaków.
- **Propsy:**
  - `name`: string
  - `lastModified`: Date string
  - `onRename`: `(newName: string) => Promise<void>`

### 4. `AddFlashcardForm`

- **Opis:** Formularz do szybkiego dodawania nowych fiszek. Powinien znajdować się na górze listy (lub być łatwo dostępny), aby umożliwić szybkie wprowadzanie danych.
- **Główne elementy:** `Card` (kontener), `Label`, `Textarea` (dla awersu i rewersu), `Button` ("Dodaj").
- **Interakcje:**
  - Wpisanie treści.
  - Kliknięcie "Dodaj" lub skrót klawiszowy (np. `Cmd+Enter`).
  - Po pomyślnym dodaniu, focus wraca do pola "Awers", a pola są czyszczone.
- **Walidacja:**
  - Awers: wymagany, max 200 znaków.
  - Rewers: wymagany, max 750 znaków.
- **Propsy:**
  - `onAdd`: `(card: CreateFlashcardRequestDTO) => Promise<void>`
  - `isSubmitting`: boolean

### 5. `FlashcardList`

- **Opis:** Lista renderująca komponenty `FlashcardItem`. Obsługuje puste stany (empty state).
- **Główne elementy:** `ul` / `div` (flex/grid container).
- **Propsy:**
  - `flashcards`: `FlashcardDTO[]`
  - `onUpdate`: `(id: string, data: UpdateFlashcardRequestDTO) => Promise<void>`
  - `onDelete`: `(id: string) => Promise<void>`

### 6. `FlashcardItem`

- **Opis:** Pojedynczy wiersz/karta reprezentująca fiszkę. Posiada dwa tryby: `view` i `edit`.
- **Tryb View (`FlashcardDisplay`):**
  - Wyświetla awers i rewers.
  - Przyciski akcji: "Edytuj", "Usuń".
  - Oznaczenie flagą (Quality flag).
- **Tryb Edit (`FlashcardEditForm`):**
  - Wyświetla formularz edycji (podobny do `AddFlashcardForm`).
  - Przyciski: "Zapisz", "Anuluj".
- **Propsy:**
  - `flashcard`: `FlashcardDTO`
  - `onUpdate`: funkcja
  - `onDelete`: funkcja

## 5. Typy

Wykorzystujemy istniejące typy z `src/types.ts`. Nie ma potrzeby tworzenia nowych, skomplikowanych typów domenowych, ale przydatne będą typy propsów dla komponentów.

Wymagane główne typy:

- `FlashcardSetDetailDTO`: Pełny obiekt zestawu.
- `FlashcardDTO`: Obiekt fiszki.
- `CreateFlashcardRequestDTO`: `{ avers: string, rewers: string, source: 'manual' }`
- `UpdateFlashcardRequestDTO`: `{ avers?: string, rewers?: string }`
- `UpdateFlashcardSetRequestDTO`: `{ name: string }`

## 6. Zarządzanie stanem

Zalecane jest użycie niestandardowego hooka `useSetEditor` wewnątrz komponentu `SetEditor`.

```typescript
// Szkic hooka
const useSetEditor = (initialData: FlashcardSetDetailDTO) => {
  const [set, setSet] = useState(initialData);
  // Stany pomocnicze np. dla optymistycznego UI lub loaderów

  const updateSetName = async (name: string) => {
    /* PATCH /api/flashcard-sets/:id */
  };

  const addFlashcard = async (data: CreateFlashcardRequestDTO) => {
    // POST /api/flashcard-sets/:setId/flashcards
    // Aktualizacja stanu lokalnego po sukcesie
  };

  const updateFlashcard = async (cardId: string, data: UpdateFlashcardRequestDTO) => {
    // PATCH /api/flashcards/:id
    // Optymistyczna aktualizacja lub czekanie na response
  };

  const deleteFlashcard = async (cardId: string) => {
    // DELETE /api/flashcards/:id
    // Usunięcie z listy lokalnej
  };

  return { set, updateSetName, addFlashcard, updateFlashcard, deleteFlashcard };
};
```

## 7. Integracja API

Integracja powinna odbywać się poprzez dedykowane funkcje w `src/lib/api-client.ts` (lub podobnym), które będą wrapperami na `fetch`.

**Endpointy:**

1.  **Pobranie danych (Server-side):**
    - Użycie: `getFlashcardSetById` (z `src/lib/flashcard-set.service.ts`) bezpośrednio w bloku frontmatter `.astro`.

2.  **Zmiana nazwy:**
    - `PATCH /api/flashcard-sets/[id]`
    - Payload: `{ name: string }`
    - Response: `FlashcardSetListItemDTO`

3.  **Dodanie fiszki:**
    - `POST /api/flashcard-sets/[id]/flashcards`
    - Payload: `{ avers: string, rewers: string, source: "manual" }`
    - Response: `FlashcardDTO`

4.  **Edycja fiszki:**
    - `PATCH /api/flashcards/[id]`
    - Payload: `{ avers?: string, rewers?: string }`
    - Response: `FlashcardDTO`

5.  **Usuwanie fiszki:**
    - `DELETE /api/flashcards/[id]`
    - Response: `204 No Content`

## 8. Interakcje użytkownika

1.  **Edycja nazwy zestawu:**
    - Użytkownik klika w nagłówek -> pole tekstowe staje się aktywne -> Użytkownik zmienia nazwę -> Klika poza pole (Blur) -> Wywołanie API -> Toast "Zmieniono nazwę".

2.  **Dodawanie fiszki:**
    - Użytkownik wypełnia pola "Pytanie" i "Odpowiedź".
    - Klika "Dodaj fiszkę".
    - Przycisk zmienia stan na `loading`.
    - Po sukcesie: Nowa fiszka pojawia się na szczycie listy, pola formularza czyszczą się, focus wraca do pola "Pytanie", Toast "Dodano fiszkę".

3.  **Edycja fiszki:**
    - Kliknięcie ikony ołówka na liście.
    - Wiersz zamienia się w formularz edycji.
    - Kliknięcie "Zapisz" -> API call -> Powrót do widoku (treść zaktualizowana).
    - Kliknięcie "Anuluj" -> Powrót do widoku (bez zmian).

4.  **Usuwanie fiszki:**
    - Kliknięcie ikony kosza.
    - Opcjonalnie: Mały dialog potwierdzenia lub "undo" toast (dla MVP wystarczy proste potwierdzenie przeglądarkowe `confirm()` lub komponent Dialog z shadcn/ui).
    - API call -> Fiszka znika z listy.

## 9. Warunki i walidacja

Walidacja powinna być spójna z API i zdefiniowana przy użyciu `zod` w komponencie (client-side) przed wysłaniem żądania.

1.  **Nazwa zestawu:**
    - `min(1)`, `max(100)`.
    - Komunikat: "Nazwa zestawu jest wymagana i nie może przekraczać 100 znaków".

2.  **Fiszka (Awers):**
    - `min(1)`, `max(200)`.
    - Komunikat: "Pytanie jest wymagane (max 200 znaków)".

3.  **Fiszka (Rewers):**
    - `min(1)`, `max(750)`.
    - Komunikat: "Odpowiedź jest wymagana (max 750 znaków)".

Komponenty formularzy (`AddFlashcardForm`, `SetHeader`) muszą wyświetlać błędy walidacji pod odpowiednimi polami input.

## 10. Obsługa błędów

- **Błędy walidacji:** Wyświetlane inline w formularzach.
- **Błędy API (np. 500, timeout):** Wyświetlane jako toasty (komponent `sonner` lub `toast` z shadcn/ui) z informacją "Wystąpił błąd podczas zapisywania".
- **Błąd 404/403 (podczas pracy):** Jeśli zestaw zostanie usunięty w innej sesji, odświeżenie listy może zwrócić błąd. Przekierowanie do dashboardu lub wyświetlenie Error Boundary.
- **Utrata połączenia:** Blokada przycisków zapisu lub kolejkowanie (poza MVP). Dla MVP: Toast z błędem.

## 11. Kroki implementacji

1.  **Przygotowanie strony Astro (`src/pages/sets/[id].astro`):**
    - Zaimplementowanie logiki pobierania danych (`getFlashcardSetById`) z obsługą błędów (przekierowanie przy błędzie).
    - Dodanie `DashboardLayout`.

2.  **Utworzenie komponentów UI (jeśli brakuje):**
    - Upewnienie się, że mamy `Input`, `Textarea`, `Button`, `Card` z biblioteki UI (shadcn).

3.  **Implementacja `SetHeader`:**
    - Stworzenie komponentu z logiką przełączania view/edit.

4.  **Implementacja `AddFlashcardForm`:**
    - Stworzenie formularza z walidacją `zod`.

5.  **Implementacja `FlashcardItem`:**
    - Stworzenie widoku karty i formularza edycji wiersza.

6.  **Implementacja `SetEditor` i hooka `useSetEditor`:**
    - Złożenie całości.
    - Implementacja funkcji komunikujących się z API (`fetch`).
    - Obsługa stanu listy fiszek.

7.  **Integracja na stronie Astro:**
    - Osadzenie `<SetEditor client:load initialData={data} />`.

8.  **Testy manualne:**
    - Sprawdzenie limitów znaków.
    - Sprawdzenie nawigacji klawiaturą przy dodawaniu wielu fiszek.
    - Weryfikacja odświeżania listy po dodaniu/usunięciu.
