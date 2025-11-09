# API Endpoint Implementation Plan: Create Flashcard Set

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie nowego zestawu fiszek (`flashcard set`). Użytkownik może utworzyć pusty zestaw lub od razu zasilić go listą fiszek. Operacja jest transakcyjna, co zapewnia spójność danych – albo cały zestaw wraz z fiszkami zostanie pomyślnie utworzony, albo żadne dane nie zostaną zapisane w bazie.

## 2. Szczegóły żądania

-   **Metoda HTTP:** `POST`
-   **Struktura URL:** `/api/flashcard-sets`
-   **Request Body:**

    ```json
    {
      "name": "string",
      "model": "string",
      "generation_duration": "integer",
      "flashcards": [
        {
          "avers": "string",
          "rewers": "string",
          "source": "string"
        }
      ]
    }
    ```

-   **Parametry:**
    -   **Wymagane:**
        -   `name` (string): Nazwa zestawu. Musi być unikalna dla użytkownika. Max 100 znaków.
        -   `model` (string): Model użyty do generacji (lub "manual"). Max 100 znaków.
        -   `generation_duration` (integer): Czas generacji w milisekundach (0 dla manualnych).
    -   **Opcjonalne:**
        -   `flashcards` (array): Tablica obiektów fiszek do utworzenia wraz z zestawem.
            -   `avers` (string): Pytanie na fiszce. Max 200 znaków.
            -   `rewers` (string): Odpowiedź na fiszce. Max 750 znaków.
            -   `source` (enum): Źródło fiszki. Dozwolone wartości: `manual`, `ai-full`, `ai-edited`.

## 3. Wykorzystywane typy

-   **Request DTO:** `CreateFlashcardSetRequestDTO`
-   **Command Models:** `FlashcardCreateCommand`, `FlashcardSetCreateCommand`
-   **Response DTO:** `CreateFlashcardSetResponseDTO` (alias dla `FlashcardSetListItemDTO`)

## 4. Przepływ danych

1.  Żądanie `POST` trafia do endpointu Astro `/api/flashcard-sets`.
2.  Middleware Astro weryfikuje token JWT. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`.
3.  Dane z ciała żądania są walidowane przy użyciu schemy `zod` zdefiniowanej w pliku endpointu. W przypadku błędu walidacji zwracany jest `400 Bad Request`.
4.  Z obiektu `context.locals.supabase` pobierany jest `user_id` zalogowanego użytkownika.
5.  Wywoływana jest funkcja `createFlashcardSet` z nowo utworzonego serwisu `src/lib/flashcard-set.service.ts`, przekazując zwalidowane dane oraz `user_id`.
6.  Serwis `flashcard-set.service` rozpoczyna transakcję w bazie danych Supabase.
7.  W ramach transakcji:
    a. Do tabeli `flashcard_sets` wstawiany jest nowy rekord z danymi zestawu i `user_id`.
    b. Jeśli w żądaniu przekazano tablicę `flashcards`, pętla iteruje po niej, wstawiając każdy rekord do tabeli `flashcards` z `set_id` nowo utworzonego zestawu.
8.  Jeśli wszystkie operacje w transakcji powiodą się, transakcja jest zatwierdzana (commit). W przeciwnym razie jest wycofywana (rollback).
9.  Serwis zwraca dane nowo utworzonego zestawu (w formacie `FlashcardSetListItemDTO`) do endpointu.
10. Endpoint wysyła odpowiedź `201 Created` z danymi zestawu w ciele odpowiedzi.

## 5. Względy bezpieczeństwa

-   **Uwierzytelnianie:** Endpoint musi być chroniony i dostępny tylko dla zalogowanych użytkowników. Middleware Astro (`src/middleware/index.ts`) będzie odpowiedzialne za weryfikację tokenu JWT.
-   **Autoryzacja:** Identyfikator użytkownika (`user_id`) musi być pobierany wyłącznie z zaufanego źródła po stronie serwera (sesja Supabase w `context.locals`), a nie z ciała żądania, aby uniemożliwić tworzenie zasobów w imieniu innych użytkowników.
-   **Walidacja danych wejściowych:** Wszystkie dane wejściowe muszą być rygorystycznie walidowane za pomocą `zod`, aby zapobiec atakom typu SQL Injection i zapewnić integralność danych. Sprawdzane będą typy, długości ciągów znaków oraz wartości enum.
-   **Integralność transakcyjna:** Cały proces tworzenia zestawu i jego fiszek musi być opakowany w transakcję bazy danych, aby uniknąć niespójnego stanu (np. utworzony zestaw bez fiszek, gdy ich dodawanie się nie powiedzie).

## 6. Obsługa błędów

-   **`201 Created`**: Operacja zakończona sukcesem. W ciele odpowiedzi znajdują się dane nowo utworzonego zestawu.
-   **`400 Bad Request`**: Błąd walidacji danych wejściowych (np. brak wymaganego pola `name`, zbyt długa nazwa, nieprawidłowa wartość `source`). Odpowiedź będzie zawierać szczegóły błędu z `zod`.
-   **`401 Unauthorized`**: Użytkownik jest niezalogowany lub jego token JWT jest nieprawidłowy.
-   **`409 Conflict`**: Użytkownik próbuje utworzyć zestaw o nazwie, która już istnieje w jego kolekcji. Błąd ten zostanie przechwycony na poziomie bazy danych dzięki ograniczeniu `UNIQUE(user_id, name)`.
-   **`500 Internal Server Error`**: Wystąpił nieoczekiwany błąd serwera, np. niepowodzenie transakcji bazy danych z przyczyn technicznych.

## 7. Rozważania dotyczące wydajności

-   Operacja jest transakcyjna i może obejmować wstawienie wielu rekordów (zestaw + fiszki). Dla bardzo dużej liczby fiszek (>100) w jednym żądaniu, operacja wstawiania w pętli może być nieoptymalna. Należy użyć metody `insert` z Supabase, która pozwala na wstawienie wielu rekordów naraz, co znacząco zredukuje liczbę zapytań do bazy danych.
-   Zapytanie zwrotne po utworzeniu zestawu powinno być zoptymalizowane, aby pobierać tylko niezbędne dane (zgodnie z `FlashcardSetListItemDTO`), w tym zagregowaną liczbę fiszek.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku serwisu:** Stworzyć nowy plik `src/lib/flashcard-set.service.ts`.
2.  **Implementacja logiki serwisu:** W `flashcard-set.service.ts` zaimplementować funkcję `createFlashcardSet`, która:
    -   Przyjmuje jako argumenty obiekt typu `FlashcardSetCreateCommand`, `userId` oraz instancję `SupabaseClient`.
    -   Implementuje logikę transakcyjną do wstawiania danych do tabel `flashcard_sets` i `flashcards`.
    -   Używa metody `insert()` do hurtowego dodawania fiszek.
    -   Obsługuje błędy bazy danych, w tym naruszenie unikalności klucza (dla błędu `409 Conflict`).
    -   Zwraca dane w formacie `FlashcardSetListItemDTO`.
3.  **Utworzenie pliku endpointu:** Stworzyć plik dla nowego endpointu, np. `src/pages/api/flashcard-sets/index.ts`.
4.  **Implementacja walidacji:** W pliku endpointu zdefiniować schemę walidacji `zod` dla `CreateFlashcardSetRequestDTO`, zgodnie ze specyfikacją.
5.  **Implementacja handlera `POST`:**
    -   Zdefiniować funkcję `POST` w pliku endpointu.
    -   Dodać `export const prerender = false;`.
    -   Pobrać i zwalidować ciało żądania.
    -   Pobrać `user_id` i klienta Supabase z `context.locals`.
    -   Wywołać serwis `createFlashcardSet`.
    -   Obsłużyć możliwe błędy (walidacji, konfliktu, błędy serwera) i zwrócić odpowiednie kody statusu oraz komunikaty.
    -   W przypadku sukcesu, zwrócić `201 Created` wraz z danymi z serwisu.
6.  **Testy jednostkowe (opcjonalnie):** Dodać testy dla `flashcard-set.service.ts`, mockując klienta Supabase, aby sprawdzić logikę biznesową i obsługę błędów.
7.  **Testy integracyjne:** Ręcznie (np. używając Postmana lub cURL) lub automatycznie przetestować działanie całego endpointu, sprawdzając wszystkie scenariusze sukcesu i błędów.
