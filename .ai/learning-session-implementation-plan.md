# Plan Wdrożenia: Sesja Nauki (Spaced Repetition)

Ten dokument zawiera szczegółowy plan implementacji funkcjonalności sesji nauki opartej na algorytmie powtórek w odstępach (Spaced Repetition). Plan jest dostosowany do stacku technologicznego (Astro, React, Supabase, Cloudflare).

## 1. Opis Usługi

Usługa `LearningSession` składa się z trzech głównych warstw:

1.  **Warstwa Danych (Supabase):** Przechowywanie postępów nauki dla każdej pary użytkownik-fiszka.
2.  **Warstwa Logiki Biznesowej (Shared/API):** Obliczanie kolejnych terminów powtórek przy użyciu algorytmu Spaced Repetition (FSRS lub SM-2).
3.  **Warstwa Prezentacji (React):** Interaktywny interfejs sesji nauki (awers/rewers, ocenianie).

Jako bibliotekę algorytmu rekomendujemy **`ts-fsrs`** (nowoczesna implementacja Free Spaced Repetition Scheduler) lub lżejszą **`supermemo`** (klasyczny SM-2). Ze względu na jakość i nowoczesność, domyślny plan zakłada `ts-fsrs`.

## 2. Model Danych (Baza Danych)

Wymagana jest nowa tabela w Supabase do śledzenia postępów.

### Tabela: `user_flashcard_progress`

| Kolumna          | Typ           | Opis                                                                         |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| `id`             | `uuid`        | PK, default `gen_random_uuid()`                                              |
| `user_id`        | `uuid`        | FK do `auth.users`, niepuste                                                 |
| `flashcard_id`   | `uuid`        | FK do `flashcards.id`, niepuste, kaskadowe usuwanie                          |
| `state`          | `text`        | Stan karty: `new`, `learning`, `review`, `relearning` (specyficzne dla FSRS) |
| `stability`      | `float`       | Parametr FSRS (stabilność pamięci)                                           |
| `difficulty`     | `float`       | Parametr FSRS (trudność materiału)                                           |
| `elapsed_days`   | `float`       | Dni od ostatniej powtórki                                                    |
| `scheduled_days` | `float`       | Dni do następnej planowanej powtórki                                         |
| `reps`           | `int`         | Liczba powtórek                                                              |
| `lapses`         | `int`         | Liczba zapomnień                                                             |
| `last_review`    | `timestamptz` | Data ostatniej powtórki                                                      |
| `next_review`    | `timestamptz` | Data następnej powtórki (kluczowe do sortowania)                             |

**Indeksy:**

- Złożony indeks na `(user_id, next_review)` dla szybkiego pobierania kart "na dziś".
- Unikalny constraint na `(user_id, flashcard_id)`.

**RLS (Row Level Security):**

- Użytkownik może widzieć i modyfikować tylko swoje rekordy (`auth.uid() = user_id`).

## 3. Struktura Klasy / Serwisu (TypeScript)

Logika powinna być zawarta w serwisie `LearningService` znajdującym się w `src/lib/services/learning.service.ts`.

### Konstruktor

Brak stanu instancji, metody statyczne lub singleton (zależnie od preferencji, tutaj podejście funkcyjne/statyczne).

### Publiczne Metody

#### `getDueFlashcards(userId: string, limit: number = 20): Promise<FlashcardWithProgress[]>`

Pobiera fiszki, których termin `next_review` jest mniejszy lub równy `now()`, lub które nie mają jeszcze wpisu w `user_flashcard_progress` (nowe karty).

- **Wejście:** `userId`, `limit`
- **Wyjście:** Tablica obiektów łączących dane fiszki z danymi postępu.

#### `processReview(userId: string, flashcardId: string, rating: Grade): Promise<void>`

Przetwarza ocenę użytkownika, oblicza nowe parametry algorytmu i aktualizuje bazę.

- **Wejście:** `userId`, `flashcardId`, `rating` (np. 1-Bad, 2-Hard, 3-Good, 4-Easy).
- **Wyjście:** `void` (lub zaktualizowany rekord).

### Prywatne Metody / Helpery

- `calculateNextState(currentParams, rating)`: Wrapper na bibliotekę `ts-fsrs`.
- `updateProgressRecord(record)`: Wywołanie Supabase update.
- `createInitialRecord(flashcardId, userId)`: Wywołanie Supabase insert.

## 4. Obsługa Błędów

Serwis musi obsługiwać następujące scenariusze błędów:

1.  **Błąd Bazy Danych:** Nieudane połączenie lub błąd zapytania Supabase.
    - _Reakcja:_ Rzuć niestandardowy błąd `DatabaseError`. Loguj błąd.
2.  **Brak Karty:** Próba oceny nieistniejącej fiszki.
    - _Reakcja:_ Rzuć `NotFoundError`.
3.  **Algorytm:** Błąd obliczeń (np. nieprawidłowe dane wejściowe).
    - _Reakcja:_ Fallback do bezpiecznych wartości domyślnych lub rzucenie `AlgorithmError`.

## 5. Kwestie Bezpieczeństwa

1.  **Walidacja danych:** Sprawdź, czy `flashcardId` należy do zestawu, do którego użytkownik ma dostęp (choć RLS to zapewni, warto sprawdzać na poziomie logiki biznesowej, czy fiszka w ogóle istnieje).
2.  **RLS:** Kluczowe zabezpieczenie w Supabase. Upewnij się, że polityki są włączone.
3.  **API Endpoints:** Endpointy API muszą weryfikować sesję użytkownika (Cloudflare Context / Supabase Auth).

## 6. Plan Wdrożenia Krok po Kroku

### Faza 1: Baza Danych i Modele

1.  **Instalacja zależności:**
    ```bash
    npm install ts-fsrs
    ```
2.  **Migracja Supabase:**
    - Utwórz plik migracji SQL tworzący tabelę `user_flashcard_progress`.
    - Dodaj polityki RLS.
    - Dodaj indeksy.
3.  **Definicja Typów:**
    - Zaktualizuj `src/types.ts` o interfejsy `UserFlashcardProgress` oraz `FlashcardWithProgress`.

### Faza 2: Logika Biznesowa (Backend/Service)

4.  **Implementacja `src/lib/services/learning.service.ts`:**
    - Import biblioteki `ts-fsrs`.
    - Implementacja funkcji `getDueFlashcards` (query do Supabase z joinem).
    - Implementacja funkcji `processReview` (logika aktualizacji).
5.  **Utworzenie Endpointów API:**
    - `GET /src/pages/api/learning/queue.ts`: Zwraca kolejkę do nauki.
    - `POST /src/pages/api/learning/review.ts`: Przyjmuje `{ flashcardId, rating }`.

### Faza 3: Interfejs Użytkownika (Frontend)

6.  **Hook `useLearningSession`:**
    - Zarządzanie stanem lokalnym: `queue`, `currentIndex`, `isFlipped`, `sessionStats`.
    - Metody: `submitGrade(rating)` (optimistic update + API call).
7.  **Komponent `FlashcardRunner`:**
    - Wyświetlanie awersu/rewersu (animacja CSS/Framer Motion).
    - Obsługa kliknięcia (obrót).
8.  **Komponent `GradingControls`:**
    - Przyciski (Zapomniałem, Trudne, Dobre, Łatwe) mapowane na oceny FSRS.
    - Widoczne tylko po odwróceniu karty.
9.  **Widok Sesji (`src/pages/study/[setId].astro` lub React component):**
    - Kontener dla `FlashcardRunner`.
    - Ekran końcowy sesji (podsumowanie).

### Faza 4: Integracja i Testy

10. **Integracja:** Podpięcie przycisku "Ucz się" na stronie zestawu.
11. **Testy Jednostkowe:** Testy dla `learning.service.ts` (mockowanie Supabase).
12. **Testy E2E:** Scenariusz przejścia całej sesji nauki.

## Przykład Użycia (Code Snippet)

```typescript
// src/lib/services/learning.service.ts (Pseudo-kod)
import { fsrs, Rating, Card } from "ts-fsrs";
import { supabase } from "@/db";

const f = fsrs();

export async function processReview(userId: string, flashcardId: string, rating: Rating) {
  // 1. Pobierz obecny stan
  const { data: record } = await supabase
    .from("user_flashcard_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("flashcard_id", flashcardId)
    .single();

  // 2. Przygotuj obiekt Card
  const card = record ? new Card({ ...record }) : new Card(); // Default new card

  // 3. Oblicz następny stan
  const scheduling_cards = f.repeat(card, new Date());
  const next_card = scheduling_cards[rating].card;

  // 4. Zapisz w bazie
  await supabase.from("user_flashcard_progress").upsert({
    user_id: userId,
    flashcard_id: flashcardId,
    ...next_card, // mapowanie pól FSRS na kolumny DB
    last_review: new Date(),
    next_review: next_card.due,
  });
}
```
