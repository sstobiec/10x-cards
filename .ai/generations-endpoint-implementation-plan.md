# API Endpoint Implementation Plan: Generate Flashcard Proposals

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia generowanie propozycji fiszek na podstawie dostarczonego przez użytkownika tekstu. Wykorzystuje zewnętrzną usługę AI do analizy treści i ekstrakcji par pytanie-odpowiedź. Wygenerowane propozycje są zwracane w czasie rzeczywistym i nie są trwale zapisywane w bazie danych, służąc jedynie do podglądu i dalszej edycji przez użytkownika przed utworzeniem nowego zestawu fiszek.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/flashcards/generate`
- **Ciało żądania (Request Body):**
  ```json
  {
    "text": "String of notes/content to generate flashcards from",
    "model": "openai/gpt-4o" 
  }
  ```
- **Parametry:**
  - **Wymagane:**
    - `text` (string): Tekst wejściowy, maksymalnie 10 000 znaków.
  - **Opcjonalne:**
    - `model` (string): Nazwa modelu AI do użycia. Jeśli pominięty, zostanie użyty domyślny model skonfigurowany w systemie.

## 3. Wykorzystywane typy
Do implementacji tego punktu końcowego niezbędne będą następujące typy zdefiniowane w `src/types.ts`:
- `GenerateFlashcardsRequestDTO`: Do walidacji i typowania przychodzącego ciała żądania.
- `GenerateFlashcardsResponseDTO`: Jako model pomyślnej odpowiedzi.
- `FlashcardProposalDTO`: Reprezentuje pojedynczą parę fiszek (awers/rewers) w odpowiedzi.
- `ErrorResponseDTO`: Standardowy format odpowiedzi w przypadku błędu.
- `CreateErrorLogRequestDTO`: Do przygotowania obiektu błędu przed zapisaniem go w bazie danych.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK):**
  ```json
  {
    "flashcard_proposals": [
      {
        "avers": "What is REST?",
        "rewers": "REST is an architectural style..."
      }
    ],
    "generation_duration": 2500,
    "model": "openai/gpt-4o"
  }
  ```
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Błąd walidacji danych wejściowych.
  - `401 Unauthorized`: Brak autoryzacji.
  - `422 Unprocessable Entity`: Nieprawidłowy format JSON.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera lub błąd generowania AI.
  - `503 Service Unavailable`: Usługa AI jest tymczasowo niedostępna.

## 5. Przepływ danych
1.  Użytkownik wysyła żądanie `POST` z tekstem do `/api/flashcards/generate`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT i dołącza sesję użytkownika do `Astro.locals`.
3.  Handler endpointu (`src/pages/api/flashcards/generate.ts`) odbiera żądanie.
4.  Dane wejściowe są walidowane przy użyciu schemy Zod. W przypadku błędu zwracany jest status `400`.
5.  Handler wywołuje funkcję z serwisu `GenerationService` (`src/lib/ai/generation.service.ts`), przekazując tekst i model.
6.  `GenerationService` wysyła zapytanie do zewnętrznego API AI (np. OpenRouter.ai).
7.  **Ścieżka sukcesu:**
    - Zewnętrzne API zwraca pomyślną odpowiedź.
    - `GenerationService` parsuje odpowiedź i zwraca tablicę obiektów `FlashcardProposalDTO`.
    - Handler endpointu formatuje odpowiedź `GenerateFlashcardsResponseDTO` i odsyła ją do klienta ze statusem `200 OK`.
8.  **Ścieżka błędu:**
    - Zewnętrzne API zwraca błąd lub odpowiedź jest nieprawidłowa.
    - `GenerationService` zgłasza wyjątek.
    - Handler endpointu przechwytuje wyjątek i wywołuje serwis `ErrorLogService` (`src/lib/logging/error.service.ts`).
    - `ErrorLogService` zapisuje szczegóły błędu (wraz z `user_id` i `input_payload`) w tabeli `error_logs`.
    - Handler zwraca odpowiedni kod błędu (`500` lub `503`) do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Dostęp do punktu końcowego jest chroniony i wymaga prawidłowego tokenu JWT. Middleware Astro jest odpowiedzialne za weryfikację tokenu.
- **Autoryzacja:** Każdy uwierzytelniony użytkownik może korzystać z tej funkcji. Nie ma dodatkowych ograniczeń opartych na rolach.
- **Walidacja danych wejściowych:** Zastosowanie Zod do walidacji ciała żądania, w szczególności ograniczenie długości pola `text` do 10 000 znaków, chroni przed nadmiernym zużyciem zasobów i potencjalnymi atakami.
- **Ochrona kluczy API:** Klucz do usługi AI musi być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`) i dostępny tylko po stronie serwera.

## 7. Obsługa błędów
Punkt końcowy będzie obsługiwał błędy w sposób kontrolowany, zwracając odpowiednie kody statusu HTTP:
- `400 Bad Request`: Zwracany, gdy walidacja Zod nie powiedzie się (np. brak pola `text`, przekroczenie limitu znaków).
- `401 Unauthorized`: Zwracany przez middleware, gdy token jest nieprawidłowy lub go brakuje.
- `500 Internal Server Error`: Zwracany w przypadku nieoczekiwanego błędu po stronie serwera, błędu parsowania odpowiedzi od AI, lub gdy zapis do tabeli `error_logs` nie powiedzie się. Szczegóły błędu zostaną zalogowane.
- `503 Service Unavailable`: Zwracany, gdy zewnętrzna usługa AI jest niedostępna. Błąd również zostanie zalogowany.

## 8. Rozważania dotyczące wydajności
- **Czas odpowiedzi:** Czas odpowiedzi jest bezpośrednio zależny od zewnętrznej usługi AI. Może wynosić od kilku do kilkunastu sekund. Należy zaimplementować po stronie klienta odpowiedni interfejs użytkownika (np. wskaźnik ładowania), aby poinformować o trwającym procesie.
- **Timeout:** Należy rozważyć ustawienie rozsądnego `timeout` dla żądania do usługi AI, aby uniknąć zbyt długiego oczekiwania w przypadku problemów z usługą.
- **Asynchroniczność:** Operacja jest z natury asynchroniczna. Cały przepływ po stronie serwera jest bezblokowy.

## 9. Etapy wdrożenia
1.  **Utworzenie serwisu AI:**
    - Stworzyć plik `src/lib/ai/generation.service.ts`.
    - Zaimplementować w nim funkcję `generateFlashcards`, która będzie komunikować się z API OpenRouter.ai, używając klucza API ze zmiennych środowiskowych.
    - Dodać obsługę błędów i parsowanie odpowiedzi do formatu `FlashcardProposalDTO[]`.
2.  **Utworzenie serwisu logowania błędów:**
    - Stworzyć plik `src/lib/logging/error.service.ts`.
    - Zaimplementować funkcję `logGenerationError`, która przyjmuje obiekt `CreateErrorLogRequestDTO` i klienta Supabase, a następnie zapisuje dane w tabeli `error_logs`.
3.  **Implementacja endpointu API:**
    - Stworzyć plik `src/pages/api/flashcards/generate.ts`.
    - Dodać `export const prerender = false;`.
    - Zdefiniować handler `POST`.
    - Zaimplementować logikę weryfikacji sesji użytkownika z `Astro.locals`.
    - Zdefiniować schemę Zod i zwalidować ciało żądania.
    - Zaimplementować blok `try...catch` do wywołania `generation.service` i obsługi błędów.
    - W bloku `catch` wywołać `error.service` w celu zalogowania błędu.
    - Zwrócić odpowiednie odpowiedzi HTTP dla ścieżki sukcesu i błędów.
4.  **Konfiguracja zmiennych środowiskowych:**
    - Dodać `OPENROUTER_API_KEY` do pliku `.env` i upewnić się, że jest on dostępny w środowisku serwerowym.