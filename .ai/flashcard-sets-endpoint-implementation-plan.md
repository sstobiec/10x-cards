# API Endpoint Implementation Plan: Flashcard Sets

## 1. Przegląd punktu końcowego

Punkt końcowy `/api/flashcard-sets` umożliwia zarządzanie zestawami fiszek. Pozwala użytkownikom na tworzenie nowych zestawów (również z wygenerowanymi fiszkami), przeglądanie listy swoich zestawów, pobieranie szczegółów konkretnego zestawu, aktualizację nazwy oraz usuwanie zestawów.

## 2. Szczegóły żądania

### 2.1. List All Flashcard Sets

- **Metoda HTTP:** `GET`
- **URL:** `/api/flashcard-sets`
- **Parametry Query:**
  - `limit` (opcjonalny): Liczba elementów (default: 50, max: 100)
  - `offset` (opcjonalny): Przesunięcie (default: 0)
  - `sort` (opcjonalny): `created_at_desc` (default) lub `created_at_asc`

### 2.2. Get Single Flashcard Set

- **Metoda HTTP:** `GET`
- **URL:** `/api/flashcard-sets/[id]`
- **Parametry URL:**
  - `id`: UUID zestawu (wymagany)

### 2.3. Create Flashcard Set

- **Metoda HTTP:** `POST`
- **URL:** `/api/flashcard-sets`
- **Body (JSON):**
  - `name` (wymagane): string, max 100 znaków
  - `model` (wymagane): string
  - `generation_duration` (wymagane): number (ms)
  - `flashcards` (opcjonalne): Tablica obiektów `FlashcardCreateCommand`

### 2.4. Update Flashcard Set

- **Metoda HTTP:** `PATCH`
- **URL:** `/api/flashcard-sets/[id]`
- **Parametry URL:**
  - `id`: UUID zestawu
- **Body (JSON):**
  - `name` (wymagane): string

### 2.5. Delete Flashcard Set

- **Metoda HTTP:** `DELETE`
- **URL:** `/api/flashcard-sets/[id]`
- **Parametry URL:**
  - `id`: UUID zestawu

## 3. Wykorzystywane typy

Należy wykorzystać definicje z `src/types.ts`:

- **DTOs:**
  - `FlashcardSetListItemDTO`
  - `FlashcardSetDetailDTO`
  - `PaginatedResponseDTO<T>`
  - `CreateFlashcardSetRequestDTO`
  - `UpdateFlashcardSetRequestDTO`
  - `CreateFlashcardSetResponseDTO`
  - `UpdateFlashcardSetResponseDTO`
- **Entities:**
  - `FlashcardSetEntity`
  - `FlashcardEntity`
- **Commands:**
  - `FlashcardCreateCommand`

## 4. Szczegóły odpowiedzi

- **200 OK:**
  - GET List: `{ data: FlashcardSetListItemDTO[], pagination: PaginationMetaDTO }`
  - GET Detail: `FlashcardSetDetailDTO`
  - PATCH: `UpdateFlashcardSetResponseDTO`
- **201 Created:**
  - POST: `CreateFlashcardSetResponseDTO`
- **204 No Content:**
  - DELETE: Brak treści
- **400 Bad Request:** Błąd walidacji danych wejściowych
- **401 Unauthorized:** Brak uwierzytelnienia
- **404 Not Found:** Zasób nie istnieje
- **409 Conflict:** Naruszenie unikalności (np. nazwa zestawu)
- **500 Internal Server Error:** Błąd serwera/bazy danych

## 5. Przepływ danych

1.  **Request Handling:** Endpointy Astro (`src/pages/api/flashcard-sets/...`) odbierają żądanie.
2.  **Authentication:** Weryfikacja sesji użytkownika za pomocą `context.locals.supabase`.
3.  **Validation:** Walidacja danych wejściowych (body/params) za pomocą biblioteki Zod.
4.  **Service Layer:** Wywołanie metod z serwisu `FlashcardSetService`.
5.  **Database Interaction:** Serwis komunikuje się z Supabase.
    - W przypadku `POST` (Create):
      1. Insert do `flashcard_sets`.
      2. (Opcjonalnie) Insert do `flashcards` z użyciem ID nowego zestawu.
    - W przypadku `GET` (List): Pobranie zestawów z licznikiem relacji (`count`).
6.  **DTO Mapping:** Transformacja wyników z bazy na odpowiednie DTO (np. obliczenie `flashcard_count` jeśli baza zwraca inną strukturę).
7.  **Response:** Zwrócenie odpowiedzi JSON z odpowiednim kodem HTTP.

## 6. Względy bezpieczeństwa

- **Authentication:** Wszystkie endpointy wymagają zalogowanego użytkownika. Sprawdzenie `user` z `supabase.auth.getUser()` lub sesji.
- **Authorization (RLS):** Supabase Row Level Security zapewnia, że użytkownik ma dostęp tylko do swoich rekordów. Dodatkowo serwis powinien jawnie filtrować po `user_id` tam, gdzie to możliwe, dla pewności.
- **Input Validation:** Ścisła walidacja Zod dla wszystkich danych przychodzących (szczególnie `flashcards` array i `name`).
- **SQL Injection:** Użycie klienta Supabase/PostgREST chroni przed SQL injection.

## 7. Obsługa błędów

- Przechwytywanie wyjątków z Supabase.
- Mapowanie błędów Postgres (np. kod `23505` unique_violation) na kod HTTP `409 Conflict`.
- Mapowanie braku rekordu na `404 Not Found`.
- Logowanie nieoczekiwanych błędów po stronie serwera (console.error).

## 8. Rozważania dotyczące wydajności

- **Paginacja:** Wymuszona paginacja dla listy zestawów (domyślny limit 50).
- **Relacje:**
  - Dla listy zestawów: Nie pobieramy pełnych danych fiszek, tylko ich liczbę (`count`).
  - Dla szczegółów: Pobieramy fiszki jednym zapytaniem (eager loading).
- **Indeksy:** Upewnić się, że `user_id` i `set_id` są indeksowane (Supabase tworzy indeksy na kluczach obcych domyślnie, ale warto zweryfikować).

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematów walidacji Zod

Utwórz plik `src/lib/validation/flashcard-sets.ts` (lub podobny) zawierający schematy Zod odpowiadające DTO:

- `createFlashcardSetSchema`
- `updateFlashcardSetSchema`
- `flashcardSetQuerySchema` (limit, offset, sort)

### Krok 2: Implementacja serwisu `FlashcardSetService`

Utwórz plik `src/lib/services/flashcard-set.service.ts`:

- Klasa `FlashcardSetService` lub zestaw funkcji eksportowanych.
- Metody: `list`, `getById`, `create`, `update`, `delete`.
- Wstrzykiwanie klienta Supabase (przekazywanie jako argument).
- Implementacja logiki biznesowej i zapytań do bazy.
- Mapowanie wyników DB na DTO.

### Krok 3: Implementacja endpointu List & Create (`index.ts`)

Utwórz plik `src/pages/api/flashcard-sets/index.ts`:

- Obsługa metody `GET`: Walidacja query params -> Service.list -> Response.
- Obsługa metody `POST`: Walidacja body -> Service.create -> Response.
- Obsługa błędów (try-catch, mapowanie błędów).

### Krok 4: Implementacja endpointu Detail, Update, Delete (`[id].ts`)

Utwórz plik `src/pages/api/flashcard-sets/[id].ts`:

- Obsługa `GET`: Walidacja ID -> Service.getById -> Response.
- Obsługa `PATCH`: Walidacja ID i body -> Service.update -> Response.
- Obsługa `DELETE`: Walidacja ID -> Service.delete -> Response.
- Obsługa błędów (404, 403, etc.).
