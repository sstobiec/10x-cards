# Plan Testów - 10x-cards

## 1. Cel i Zakres

### Główne cele testowania

1.  **Weryfikacja procesów biznesowych:** Zapewnienie, że użytkownik może zarejestrować się, wygenerować zestaw fiszek przy pomocy AI i zapisać go w bazie danych.
2.  **Bezpieczeństwo danych:** Potwierdzenie izolacji danych między użytkownikami (szczególnie w kontekście konfiguracji RLS w Supabase).
3.  **Stabilność integracji AI:** Zapewnienie odporności aplikacji na błędy API OpenRouter (limity, timeouty, błędne formaty danych).

### Zakres funkcjonalny

- Autentykacja (Rejestracja, Logowanie, Reset hasła).
- Generowanie fiszek (Integracja z AI, parsowanie odpowiedzi).
- Zarządzanie zestawami (CRUD, zapis transakcyjny do DB).
- Zabezpieczenia tras (Middleware).

### Zakres techniczny

- Backend: Astro API Endpoints, Supabase (PostgreSQL, Auth, Triggers).
- Frontend: React Components (Shadcn/ui), Astro Pages.

## 2. Strategia Testowa

Ze względu na naturę projektu (MVP z kluczową integracją AI i zewnętrzną bazą danych), przyjmujemy strategię **"Test Pyramid"** z silnym naciskiem na szybkie testy integracyjne usług.

1.  **Podejście:**
    - **Logika AI:** Testowana jednostkowo z pełnym mockowaniem odpowiedzi OpenRouter (unikamy kosztów i niestabilności).
    - **Baza Danych:** Testy integracyjne uruchamiane na lokalnej instancji Supabase (lub z wykorzystaniem Docker), aby zweryfikować transakcje i triggery SQL.
    - **Interfejs:** Testy komponentów dla skomplikowanych formularzy, E2E dla ścieżek krytycznych.

2.  **Środowiska:**
    - **Local/CI:** Testy uruchamiane przy każdym PR.
    - **Staging:** Testy manualne i E2E przed wdrożeniem na produkcję.

## 3. Typy Testów

### 3.1. Testy Jednostkowe (Unit Tests)

Testowanie izolowanej logiki biznesowej.

- **Cel:** `src/lib/`
- **Kluczowe przypadki:**
  - `flashcard-set.service.ts`: Obsługa błędów transakcji, mapowanie DTO, rzucanie wyjątków `FlashcardSetNameConflictError`.
  - `ai/generation.service.ts`: Parsowanie poprawnego JSON z AI, obsługa uszkodzonego JSON, obsługa timeoutów.
  - `utils.ts`: Funkcje pomocnicze.

### 3.2. Testy Integracyjne (Integration Tests)

Weryfikacja współpracy modułów (API <-> DB, Komponent <-> API).

- **Backend (API Routes & DB):**
  - Weryfikacja działania `src/pages/api`.
  - Sprawdzenie poprawności zapytań SQL (czy triggery `update_flashcard_source_on_edit` działają poprawnie).
  - **Kluczowe:** Test bezpieczeństwa RLS – próba odczytu danych innego użytkownika (powinna zwrócić pusty wynik lub błąd).
- **Middleware:**
  - Czy niezalogowany użytkownik jest przekierowany z `/generate` na `/login`?
  - Czy publiczne ścieżki są dostępne?

### 3.3. Testy Komponentów (Component Tests)

Testowanie interakcji w UI (React).

- **Cel:** `src/components/auth`, `src/components/views`
- **Przypadki:**
  - Walidacja formularzy (poprawne/niepoprawne email, hasło).
  - Wyświetlanie stanów ładowania (loading states) podczas generowania.
  - Obsługa błędów w UI (np. wyświetlenie toasta z błędem).

### 3.4. Testy Systemowe / E2E

Symulacja zachowania prawdziwego użytkownika.

- **Scenariusz Krytyczny (Happy Path):**
  1.  Użytkownik wchodzi na stronę główną.
  2.  Rejestruje nowe konto.
  3.  Loguje się.
  4.  Wpisuje temat w generatorze i klika "Generuj".
  5.  Weryfikuje, że fiszki się pojawiły.
  6.  Zapisuje zestaw.
  7.  Wylogowuje się.

## 4. Priorytetowe Obszary

| Priorytet          | Obszar                          | Uzasadnienie                                                                                                                    |
| :----------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------ |
| **P0 (Krytyczny)** | **Bezpieczeństwo Danych (RLS)** | W kodzie widoczne są pliki sugerujące wyłączenie RLS (`disable_rls.sql`). Weryfikacja izolacji danych jest absolutnie kluczowa. |
| **P0 (Krytyczny)** | **Generowanie AI**              | To główna wartość aplikacji. Musi działać stabilnie (nawet na mockach), a parsowanie odpowiedzi musi być pancerne.              |
| **P1 (Wysoki)**    | **Rejestracja i Logowanie**     | Bez tego użytkownik nie skorzysta z aplikacji.                                                                                  |
| **P1 (Wysoki)**    | **Zapisywanie Zestawów**        | `flashcard-set.service.ts` zawiera logikę transakcyjną, która musi gwarantować spójność danych (zestaw + fiszki).               |
| **P2 (Średni)**    | **Edycja Fiszek**               | Sprawdzenie, czy trigger zmieniający źródło na `ai-edited` działa.                                                              |

## 5. Narzędzia i Środowisko

Rekomendowany stack narzędziowy, kompatybilny z Astro 5 i React 19:

- **Runner & Unit/Integration:** `Vitest`
  - Dlaczego: Natywne wsparcie dla Vite/Astro, bardzo szybki.
- **Testy Komponentów:** `React Testing Library`
  - Dlaczego: Standard rynkowy dla Reacta.
- **Testy E2E:** `Playwright`
  - Dlaczego: Niezawodny, obsługuje wiele przeglądarek, świetne narzędzia do debugowania.
- **Mockowanie API:** `MSW (Mock Service Worker)` lub wbudowane mocki Vitest (`vi.mock`).
  - Dlaczego: Niezbędne do uniezależnienia się od OpenRouter.
- **Baza Danych:** `Supabase CLI` (lokalna instancja).
  - Dlaczego: Umożliwia uruchomienie testów na "prawdziwej" bazie Postgres bez dotykania produkcji.

### Konfiguracja środowiska CI (Github Actions)

1.  Postawienie lokalnej bazy Supabase (`supabase start`).
2.  Uruchomienie migracji.
3.  Uruchomienie testów (`npm run test`, `npm run test:e2e`).

## 6. Kryteria i Harmonogram

### Definicja "Gotowe" (Definition of Done)

- [ ] Wszystkie testy jednostkowe przechodzą (100% pass rate).
- [ ] Scenariusz E2E "Rejestracja -> Generacja -> Zapis" przechodzi pomyślnie.
- [ ] Testy bezpieczeństwa potwierdzają, że użytkownik A nie widzi zestawów użytkownika B.
- [ ] Kod posiada pokrycie testami (Code Coverage) na poziomie min. 70% dla logiki biznesowej (`src/lib`).

### Proponowany Harmonogram

1.  **Faza 1: Fundamenty (Dni 1-2)**
    - Konfiguracja Vitest i Playwright.
    - Napisanie mocków dla OpenRouter (`generation.service.ts`).
    - Testy jednostkowe dla `flashcard-set.service.ts`.

2.  **Faza 2: Bezpieczeństwo i API (Dni 3-4)**
    - Testy integracyjne endpointów API.
    - **Weryfikacja i naprawa polityk RLS w Supabase** (priorytet!).

3.  **Faza 3: E2E i UI (Dzień 5)**
    - Implementacja głównego scenariusza w Playwright.
    - Drobne testy walidacji formularzy.
