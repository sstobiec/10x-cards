# Specyfikacja Techniczna: Moduł Autentykacji Użytkowników

## 1. Architektura Interfejsu Użytkownika (Frontend)

### 1.1. Nowe Strony (Astro)

W celu obsługi procesów autentykacji, utworzone zostaną następujące strony w katalogu `src/pages`:

- `src/pages/login.astro`: Strona logowania. Będzie renderować komponent React `LoginForm`. Dostępna tylko dla niezalogowanych użytkowników.
- `src/pages/register.astro`: Strona rejestracji. Będzie renderować komponent React `RegisterForm`. Dostępna tylko dla niezalogowanych użytkowników.
- `src/pages/reset-password.astro`: Strona do inicjowania procesu odzyskiwania hasła. Będzie renderować komponent `ResetPasswordForm`.
- `src/pages/update-password.astro`: Strona, na którą użytkownik jest przekierowywany z linku w mailu w celu ustawienia nowego hasła. Będzie renderować komponent `UpdatePasswordForm`.

### 1.2. Modyfikacja Layoutu i Komponentów

#### `src/layouts/Layout.astro`

Layout zostanie zaktualizowany, aby dynamicznie renderować stan interfejsu w zależności od statusu zalogowania użytkownika.

- **Logika**: W sekcji `<script>` layoutu zostanie dodana logika pobierająca sesję użytkownika z `Astro.locals`.
- **Interfejs (Auth)**:
  - W prawym górnym rogu, zamiast przycisku "Login", pojawi się nazwa użytkownika oraz rozwijane menu (dropdown).
  - Menu będzie zawierać link do panelu użytkownika (w przyszłości) oraz przycisk "Wyloguj".
- **Interfejs (Non-Auth)**:
  - W prawym górnym rogu widoczne będą przyciski "Zaloguj się" i "Zarejestruj się".

#### Nowe Komponenty (React)

Wszystkie nowe komponenty formularzy zostaną umieszczone w `src/components/auth/`. Będą to komponenty klienckie (`client:load`).

- **`AuthForm.tsx`**: Generyczny komponent obudowujący formularze, zawierający tytuł, pola `Input` i `Button` z biblioteki `shadcn/ui`. Będzie zarządzał stanem ładowania i wyświetlaniem błędów.
- **`LoginForm.tsx`**:
  - **Odpowiedzialność**: Obsługa logowania użytkownika.
  - **Pola**: Email, Hasło.
  - **Walidacja (Client-side)**: Sprawdzanie formatu emaila i obecności hasła. Komunikaty o błędach będą wyświetlane pod odpowiednimi polami.
  - **Akcje**: Po wysłaniu formularza, komponent wykona zapytanie `POST` do endpointu `/api/auth/login`. W przypadku sukcesu, nastąpi przekierowanie do strony głównej (`/`). W przypadku błędu, wyświetli globalny komunikat (np. "Nieprawidłowy email lub hasło").
- **`RegisterForm.tsx`**:
  - **Odpowiedzialność**: Rejestracja nowego użytkownika.
  - **Pola**: Nazwa użytkownika, Email, Hasło, Powtórz Hasło.
  - **Walidacja (Client-side)**: Sprawdzanie unikalności nazwy użytkownika (opcjonalnie, poprzez debounce'owane zapytanie do API), poprawności formatu emaila, złożoności hasła oraz zgodności haseł.
  - **Akcje**: Po wysłaniu, wykonuje zapytanie `POST` do `/api/auth/register`. Po sukcesie, użytkownik **nie jest automatycznie logowany** (zmiana w stosunku do `US-001` w PRD na rzecz bezpieczeństwa i standardowego przepływu Supabase Auth). Zamiast tego, formularz jest ukrywany, a na jego miejscu pojawia się komunikat informujący o konieczności potwierdzenia adresu email poprzez kliknięcie w link wysłany na podaną skrzynkę.
- **`UserDropdown.tsx`**: Komponent wyświetlający menu dla zalogowanego użytkownika. Będzie zawierał logikę do wylogowania (zapytanie do `/api/auth/logout`).

### 1.3. Scenariusze Użytkownika

- **Dostęp do chronionych stron**: Niezalogowany użytkownik, próbując wejść na `/generate`, zostanie przekierowany na `/login`.
- **Walidacja formularzy**: Błędy walidacji (np. pustego pola, złego formatu emaila) są wyświetlane w czasie rzeczywistym pod polami formularza.
- **Błędy API**: Błędy zwrócone przez serwer (np. "Użytkownik już istnieje", "Błędne hasło") są wyświetlane jako ogólny komunikat błędu nad przyciskiem formularza.
- **Proces rejestracji**: Po pomyślnej rejestracji użytkownik widzi komunikat "Sprawdź swoją skrzynkę mailową, aby potwierdzić rejestrację" i jest zachęcany do przejścia na stronę logowania.

## 2. Logika Backendowa

### 2.1. Middleware

Plik `src/middleware/index.ts` będzie centralnym punktem kontroli dostępu.

- **Logika**: Middleware będzie przechwytywać każde żądanie. Przy użyciu klienta Supabase (inicjalizowanego z `context.cookies`), będzie sprawdzać istnienie i ważność sesji.
- **Dane sesji**: Informacje o zalogowanym użytkowniku (lub `null`) zostaną przekazane do wszystkich stron i endpointów API poprzez `Astro.locals.user`.
- **Ochrona stron**: Zdefiniowana zostanie lista chronionych ścieżek (np. `/generate`, `/api/flashcard-sets`). Jeśli użytkownik nie jest zalogowany (`Astro.locals.user` jest `null`) i próbuje uzyskać dostęp do chronionego zasobu, zostanie przekierowany na `/login`.
- **Ochrona stron autentykacji**: Zalogowany użytkownik próbujący wejść na `/login` lub `/register` zostanie przekierowany na stronę główną (`/`).

### 2.2. Endpointy API

Nowe endpointy zostaną utworzone w `src/pages/api/auth/`. Będą to pliki `.ts` obsługujące metody `POST`.

- **`login.ts` (`/api/auth/login`)**:
  - **Walidacja**: Użycie biblioteki `zod` do walidacji `email` i `password`.
  - **Logika**: Wywołanie `supabase.auth.signInWithPassword()`. Supabase automatycznie zarządza sesją i ustawia odpowiednie ciasteczka `httpOnly`.
  - **Odpowiedź**: W przypadku sukcesu zwraca `200 OK`. W przypadku błędu (np. nieprawidłowe dane) zwraca `401 Unauthorized` z komunikatem błędu.
- **`register.ts` (`/api/auth/register`)**:
  - **Walidacja**: `zod` do walidacji `username`, `email`, `password`.
  - **Logika**: Wywołanie `supabase.auth.signUp()`. Nazwa użytkownika (`username`) zostanie zapisana w polu `user_metadata` w Supabase. Opcja `emailRedirectTo` zostanie skonfigurowana, aby kierować użytkownika z powrotem do aplikacji po potwierdzeniu.
  - **Odpowiedź**: `201 Created` w przypadku sukcesu. `409 Conflict` jeśli użytkownik już istnieje.
- **`logout.ts` (`/api/auth/logout`)**:
  - **Logika**: Wywołanie `supabase.auth.signOut()`. To unieważni sesję i usunie ciasteczka.
  - **Odpowiedź**: `200 OK` i przekierowanie na stronę główną.
- **`reset-password.ts` (`/api/auth/reset-password`)**:
  - **Logika**: Wywołanie `supabase.auth.resetPasswordForEmail()`.
  - **Odpowiedź**: Zawsze zwraca `200 OK`, aby uniemożliwić zgadywanie, czy dany email istnieje w bazie.

### 2.3. Modyfikacja Istniejących Endpointów

Endpointy takie jak `src/pages/api/flashcard-sets/index.ts` oraz `.../flashcards/generate.ts` zostaną zaktualizowane:

- Na początku każdej funkcji obsługującej żądanie, zostanie dodana klauzula sprawdzająca `Astro.locals.user`.
- Jeśli `Astro.locals.user` jest `null`, endpoint zwróci `401 Unauthorized`.
- Identyfikator użytkownika (`Astro.locals.user.id`) będzie używany we wszystkich zapytaniach do bazy danych, aby zapewnić, że użytkownicy mają dostęp wyłącznie do swoich danych.

## 3. System Autentykacji (Supabase Auth)

### 3.1. Konfiguracja

- **Zmienne środowiskowe**: Klucze `SUPABASE_URL` i `SUPABASE_ANON_KEY` zostaną dodane do zmiennych środowiskowych projektu.
- **Inicjalizacja Klienta**: Utworzony zostanie serwerowy klient Supabase w `src/db/supabase.server.ts`, który będzie używany w middleware i endpointach API. Klient ten będzie skonfigurowany do odczytu i zapisu ciasteczek z kontekstu żądania (`Astro.cookies`).
- **Klient Kliencki**: W `src/db/supabase.client.ts` pozostanie klient używany po stronie przeglądarki, jeśli zajdzie taka potrzeba (chociaż większość logiki będzie realizowana przez API).

### 3.2. Przepływ Danych (Flows)

1.  **Logowanie**:
    - Użytkownik wypełnia `LoginForm` -> `fetch POST /api/auth/login`.
    - API `login.ts` wywołuje `signInWithPassword` -> Supabase waliduje dane i jeśli są poprawne, generuje JWT.
    - Supabase ustawia w odpowiedzi `Set-Cookie` z tokenem sesji (ciasteczko `httpOnly`, `secure`).
    - Frontend otrzymuje `200 OK` i przekierowuje na `/`.
2.  **Rejestracja**:
    - Użytkownik wypełnia `RegisterForm` -> `fetch POST /api/auth/register`.
    - API `register.ts` wywołuje `signUp` -> Supabase tworzy nowego użytkownika ze statusem `unconfirmed` i wysyła email z linkiem weryfikacyjnym.
    - Frontend otrzymuje `201 Created` i wyświetla stosowny komunikat.
3.  **Ochrona Strony (SSR)**:
    - Użytkownik wchodzi na `/generate`.
    - Middleware `index.ts` jest aktywowane.
    - Klient serwerowy Supabase odczytuje token z ciasteczek przeglądarki i weryfikuje go.
    - Jeśli token jest nieprawidłowy lub go nie ma, middleware zwraca `Astro.redirect('/login')`.
    - Jeśli token jest ważny, `Astro.locals.user` jest ustawiane, a renderowanie strony jest kontynuowane.
4.  **Wylogowanie**:
    - Użytkownik klika "Wyloguj" w `UserDropdown` -> `fetch POST /api/auth/logout`.
    - API `logout.ts` wywołuje `signOut` -> Supabase unieważnia token i wysyła nagłówek `Set-Cookie` czyszczący ciasteczko sesji.
    - Frontend przekierowuje na `/`.
