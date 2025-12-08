# API Endpoint Implementation Plan: Error Logs

<analysis>
1.  **Spec Summary**: The endpoint `POST /api/error-logs` allows authenticated users to log errors, specifically AI generation failures. It requires authentication.
2.  **Parameters**:
    *   Required: `model`, `error_type`, `error_message`.
    *   Optional: `input_payload`.
3.  **Types**: `CreateErrorLogRequestDTO`, `CreateErrorLogResponseDTO` (from `src/types.ts`). `ErrorLogEntity`.
4.  **Service**: Need to create `src/lib/services/error-logs.ts`. Will contain `createErrorLog`.
5.  **Validation**: Zod schema in the endpoint.
    *   `model`: string, max 100.
    *   `error_type`: string, max 100.
    *   `error_message`: string.
    *   `input_payload`: json/object (optional).
6.  **Error Logging**: The endpoint *is* the error logging mechanism. It inserts into `error_logs`.
7.  **Security**: JWT Auth required. RLS handles DB security. Input sanitization/validation via Zod.
8.  **Errors**: 400 (Zod), 401 (Auth), 500 (Server).
</analysis>

## 1. Przegląd punktu końcowego
Punkt końcowy `POST /api/error-logs` umożliwia uwierzytelnionym użytkownikom (oraz aplikacji działającej w ich imieniu) rejestrowanie błędów operacyjnych, ze szczególnym uwzględnieniem niepowodzeń generowania treści przez AI. Logi te są przechowywane w tabeli `error_logs` i służą do celów diagnostycznych.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/error-logs`
- **Parametry:** Brak (ani w ścieżce, ani w zapytaniu)
- **Request Body:** JSON (zgodny z `CreateErrorLogRequestDTO`)
  - **Wymagane:**
    - `model` (string, max 100 znaków): Identyfikator modelu AI lub komponentu.
    - `error_type` (string, max 100 znaków): Kategoria błędu (np. "AI_GENERATION_FAILED").
    - `error_message` (string): Opis błędu.
  - **Opcjonalne:**
    - `input_payload` (JSON): Dane wejściowe, które spowodowały błąd (np. tekst źródłowy).

## 3. Wykorzystywane typy
- **DTO (z `src/types.ts`):**
  - `CreateErrorLogRequestDTO`
  - `CreateErrorLogResponseDTO`
- **Command Models:** Nie dotyczy (prosta operacja insert).
- **Service:** `src/lib/services/error-logs.ts` (do utworzenia).

## 3. Szczegóły odpowiedzi
- **Kod sukcesu:** `201 Created`
- **Format:** JSON (`CreateErrorLogResponseDTO`)
- **Struktura:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "model": "string",
    "error_type": "string",
    "error_message": "string",
    "created_at": "ISO-8601 string",
    "updated_at": "ISO-8601 string"
  }
  ```
  *Uwaga: `input_payload` nie jest zwracany w odpowiedzi.*

## 4. Przepływ danych
1.  **Klient** wysyła żądanie `POST` z danymi błędu.
2.  **Astro Endpoint (`src/pages/api/error-logs.ts`)** odbiera żądanie.
3.  **Weryfikacja sesji:** Sprawdzenie, czy użytkownik jest zalogowany (`context.locals.user`).
4.  **Walidacja danych:** Sprawdzenie poprawności payloadu za pomocą schematu Zod (typy, długość ciągów znaków).
5.  **Serwis (`src/lib/services/error-logs.ts`):** Wywołanie funkcji `createErrorLog`.
6.  **Baza danych (Supabase):** Wstawienie rekordu do tabeli `error_logs` z powiązanym `user_id`.
7.  **Odpowiedź:** Zwrócenie utworzonego obiektu do klienta.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie:** Wymagany ważny token JWT/sesja Supabase. Żądania bez sesji otrzymują `401 Unauthorized`.
- **Autoryzacja (RLS):** Polityki Row Level Security w bazie danych zapewniają, że użytkownicy mogą dodawać wpisy tylko przypisane do własnego ID.
- **Walidacja wejścia:** Ścisła kontrola długości pól `model` i `error_type` (max 100) aby uniknąć błędów bazy danych.

## 6. Obsługa błędów
- **400 Bad Request:**
  - Brakujące pola wymagane.
  - Przekroczenie limitu znaków.
  - Nieprawidłowy format JSON.
- **401 Unauthorized:**
  - Brak zalogowanego użytkownika.
- **500 Internal Server Error:**
  - Błąd połączenia z bazą danych.
  - Nieoczekiwany wyjątek po stronie serwera.

## 7. Rozważania dotyczące wydajności
- Operacja jest prostym wstawieniem (`INSERT`), powinna być bardzo szybka.
- `input_payload` jest typu JSONB – należy unikać przesyłania w nim ekstremalnie dużych obiektów, choć Postgres radzi sobie z tym dobrze.
- Endpoint powinien być asynchroniczny.

## 8. Etapy wdrożenia
1.  **Utworzenie serwisu**:
    - Plik: `src/lib/services/error-logs.ts`
    - Implementacja funkcji `createErrorLog` przyjmującej klienta Supabase, userId i dane DTO.
2.  **Utworzenie endpointu API**:
    - Plik: `src/pages/api/error-logs.ts`
    - Implementacja handlera `POST`.
    - Dodanie walidacji Zod.
    - Integracja z serwisem.
3.  **Weryfikacja**:
    - Testy manualne (np. przy użyciu `curl` lub klienta HTTP w IDE) w celu potwierdzenia poprawnego zapisu w bazie.

