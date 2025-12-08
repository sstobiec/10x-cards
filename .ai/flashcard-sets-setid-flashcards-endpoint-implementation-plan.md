# API Endpoint Implementation Plan: Flashcard CRUD Operations

## 1. Przegląd punktu końcowego

Plan dotyczy wdrożenia zestawu endpointów REST API umożliwiających pełne zarządzanie cyklem życia pojedynczej fiszki (Create, Read, Update, Delete) oraz zarządzanie jej statusem (Flag). Endpointy te będą obsługiwać żądania z frontendu, zapewniać walidację danych oraz komunikować się z bazą danych Supabase za pośrednictwem dedykowanego serwisu.

Operacje:
1.  Dodawanie nowej fiszki do zestawu.
2.  Aktualizacja treści fiszki.
3.  Usuwanie fiszki.
4.  Przełączanie flagi (oznaczanie jako wymagająca uwagi/słabej jakości).

## 2. Szczegóły żądania

### 2.1. Add Flashcard to Set
- **Metoda HTTP:** `POST`
- **Ścieżka pliku:** `src/pages/api/flashcard-sets/[setId]/flashcards.ts`
- **URL:** `/api/flashcard-sets/:setId/flashcards`
- **Parametry URL:**
    - `setId` (wymagany, UUID)
- **Request Body (JSON):**
    - `avers` (string, wymagany, max 200 znaków)
    - `rewers` (string, wymagany, max 750 znaków)
    - `source` (enum: 'manual', 'ai-full', 'ai-edited')

### 2.2. Update Flashcard
- **Metoda HTTP:** `PATCH`
- **Ścieżka pliku:** `src/pages/api/flashcards/[id].ts`
- **URL:** `/api/flashcards/:id`
- **Parametry URL:**
    - `id` (wymagany, UUID fiszki)
- **Request Body (JSON):**
    - `avers` (string, opcjonalny, max 200 znaków)
    - `rewers` (string, opcjonalny, max 750 znaków)

### 2.3. Delete Flashcard
- **Metoda HTTP:** `DELETE`
- **Ścieżka pliku:** `src/pages/api/flashcards/[id].ts`
- **URL:** `/api/flashcards/:id`
- **Parametry URL:**
    - `id` (wymagany, UUID fiszki)

### 2.4. Toggle Flashcard Flag
- **Metoda HTTP:** `PATCH`
- **Ścieżka pliku:** `src/pages/api/flashcards/[id]/flag.ts`
- **URL:** `/api/flashcards/:id/flag`
- **Parametry URL:**
    - `id` (wymagany, UUID fiszki)
- **Request Body (JSON):**
    - `flagged` (boolean, wymagany)

## 3. Wykorzystywane typy

Wykorzystamy istniejące definicje z `src/types.ts`:

- **DTOs:**
    - `CreateFlashcardRequestDTO`
    - `CreateFlashcardResponseDTO` (alias `FlashcardDTO`)
    - `UpdateFlashcardRequestDTO`
    - `UpdateFlashcardResponseDTO` (alias `FlashcardDTO`)
    - `ToggleFlashcardFlagRequestDTO`
    - `ToggleFlashcardFlagResponseDTO`

- **Enums:**
    - `FlashcardSource` ('manual' | 'ai-full' | 'ai-edited')

## 4. Szczegóły odpowiedzi

### Kody statusu HTTP:
- `200 OK` - Pomyślna aktualizacja lub przełączenie flagi.
- `201 Created` - Pomyślne utworzenie fiszki.
- `204 No Content` - Pomyślne usunięcie.
- `400 Bad Request` - Błąd walidacji danych wejściowych (np. zbyt długi tekst, brak pola).
- `401 Unauthorized` - Brak lub nieprawidłowy token JWT (użytkownik niezalozowany).
- `403 Forbidden` - Próba dostępu do zasobu należącego do innego użytkownika.
- `404 Not Found` - Zasób (zestaw lub fiszka) nie istnieje.
- `422 Unprocessable Entity` - Niepoprawny format danych (np. JSON parsing error).
- `500 Internal Server Error` - Nieoczekiwany błąd serwera/bazy danych.

### Przykładowe ciało odpowiedzi (Success - Create/Update):
```json
{
  "id": "uuid",
  "set_id": "uuid",
  "avers": "Treść pytania",
  "rewers": "Treść odpowiedzi",
  "source": "manual",
  "flagged": false,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

## 5. Przepływ danych

1.  **Odbiór żądania:** Endpoint Astro (`APIRoute`) odbiera żądanie.
2.  **Uwierzytelnienie:** Weryfikacja sesji użytkownika poprzez `context.locals`. Pobranie `user.id`.
3.  **Walidacja:** Walidacja parametrów URL i body przy użyciu biblioteki `zod`.
4.  **Logika biznesowa (Service):** Przekazanie danych do `FlashcardService`.
5.  **Baza danych (Supabase):**
    - Wykonanie zapytania do odpowiedniej tabeli (`flashcards` lub `flashcard_sets` dla weryfikacji).
    - Zastosowanie filtrów `user_id` w celu zapewnienia izolacji danych (RLS support).
6.  **Odpowiedź:** Zwrócenie odpowiedniego DTO i kodu statusu.

## 6. Względy bezpieczeństwa

- **Authentication:** Każdy endpoint musi sprawdzać obecność użytkownika w `context.locals.user`. Jeśli brak -> `401`.
- **Authorization & RLS:** Wszystkie zapytania do bazy danych muszą uwzględniać kontekst użytkownika lub polegać na Row Level Security.
    - Przy dodawaniu: Sprawdzenie, czy `setId` należy do użytkownika.
    - Przy edycji/usuwaniu: Sprawdzenie, czy `id` fiszki należy do zestawu, który należy do użytkownika.
- **Input Validation:** Ścisła walidacja długości ciągów znaków (`avers`: 200, `rewers`: 750) zapobiega atakom typu DoS (zapychanie bazy) oraz błędom UI.
- **Sanitization:** Użycie sparametryzowanych zapytań (poprzez SDK Supabase) chroni przed SQL Injection.

## 7. Obsługa błędów

Błędy będą przechwytywane w bloku `try-catch` w każdym handlerze.

| Typ Błędu | Kod HTTP | Akcja |
|-----------|----------|-------|
| `ZodError` | 400 | Zwróć szczegóły walidacji w JSON. |
| `AuthError` (brak sesji) | 401 | Zwróć komunikat o braku autoryzacji. |
| `ResourceNotFoundError` (custom) | 404 | Zwróć komunikat "Not Found". |
| `AccessDeniedError` (custom) | 403 | Zwróć komunikat "Forbidden". |
| Inne błędy | 500 | Zaloguj błąd w konsoli i zwróć ogólny komunikat. |

## 8. Rozważania dotyczące wydajności

- **Prerender = false:** Wszystkie endpointy muszą być dynamiczne (SSR).
- **Indeksy:** Tabele posiadają klucze obce (`set_id`, `user_id`), które są automatycznie indeksowane w Supabase/Postgres, co zapewnia szybkie wyszukiwanie.
- **Optymalizacja zapytań:** Pobieramy tylko wymagane pola (lub `select()`), unikając zbędnego transferu danych.

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematów walidacji Zod
Zdefiniowanie schematów walidacji w `src/lib/validation/flashcards.ts` (lub bezpośrednio w serwisie/handlerze, jeśli plik walidacji nie istnieje).
- `createFlashcardSchema`
- `updateFlashcardSchema`
- `toggleFlagSchema`

### Krok 2: Implementacja `FlashcardService`
Utworzenie pliku `src/lib/services/flashcards.ts`. Implementacja metod:
- `createFlashcard`
- `updateFlashcard`
- `deleteFlashcard`
- `toggleFlashcardFlag`
Każda metoda powinna przyjmować klienta Supabase, `userId` oraz dane wejściowe.

### Krok 3: Implementacja endpointu dodawania (Create)
Utworzenie `src/pages/api/flashcard-sets/[setId]/flashcards.ts`.
- Obsługa metody `POST`.

### Krok 4: Implementacja endpointów edycji i usuwania (Update/Delete)
Utworzenie `src/pages/api/flashcards/[id].ts`.
- Obsługa metody `PATCH`.
- Obsługa metody `DELETE`.

### Krok 5: Implementacja endpointu flagowania (Toggle Flag)
Utworzenie `src/pages/api/flashcards/[id]/flag.ts`.
- Obsługa metody `PATCH`.

### Krok 6: Weryfikacja manualna
Przetestowanie endpointów przy użyciu narzędzia klienta HTTP (np. cURL, Postman lub wbudowany klient w Cursor) w celu potwierdzenia poprawności kodów błędów i sukcesu.

