# Plan implementacji widoku Profilu Użytkownika

## 1. Przegląd

Widok Profilu Użytkownika (`ProfileView`) to dedykowana strona, na której zalogowany użytkownik może sprawdzić podstawowe informacje o swoim koncie (adres email, identyfikator) oraz bezpiecznie wylogować się z aplikacji. Widok ten realizuje wymagania dotyczące bezpiecznego dostępu i zarządzania sesją (US-015).

## 2. Routing widoku

- **Ścieżka URL:** `/profile`
- **Typ strony:** `Astro Page` (Renderowana po stronie serwera - SSR)
- **Zabezpieczenie:** Strona wymaga aktywnej sesji (middleware przekieruje niezalogowanych użytkowników do `/signin`).

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o architekturę wyspową (Astro Islands), gdzie główny kontener strony jest statyczny, a interaktywne elementy (przycisk wylogowania) są komponentami React.

Drzewo komponentów:

```
src/pages/profile.astro (Page Controller & Layout)
└── src/layouts/Layout.astro (Main Layout)
    └── src/components/profile/UserProfile.tsx (React Container)
        └── src/components/ui/card.tsx (Shadcn UI Wrapper)
            ├── CardHeader (Title)
            ├── CardContent (User Info)
            │   ├── Avatar/Icon
            │   └── UserDetails (Email, ID)
            └── CardFooter (Actions)
                └── Button (Shadcn UI - Logout Action)
```

## 4. Szczegóły komponentów

### `src/pages/profile.astro`

- **Opis:** Główny plik strony odpowiedzialny za pobranie danych użytkownika z kontekstu serwera (`locals`) i przekazanie ich do komponentu interfejsu.
- **Główne elementy:**
  - Walidacja sesji po stronie serwera (choć middleware to robi, warto mieć `guard clause`).
  - Przekazanie obiektu `user` do komponentu React.
- **Typy:** Brak (wykorzystuje typy globalne `App.Locals`).

### `src/components/profile/UserProfile.tsx`

- **Opis:** Komponent React prezentujący dane użytkownika w estetycznej karcie oraz obsługujący logikę wylogowania.
- **Główne elementy:**
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (z `shadcn/ui`).
  - `Button` (wariant `destructive` dla wylogowania).
  - `Label`, `Input` (jako `readOnly` do wyświetlenia emaila) lub proste tagi tekstowe.
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku "Wyloguj się" (`handleLogout`).
- **Obsługiwana walidacja:**
  - Brak walidacji formularzy (widok tylko do odczytu).
- **Propsy:**
  - `user`: Obiekt zawierający dane użytkownika (email, id).

## 5. Typy

Wymagane zdefiniowanie propsów dla komponentu React.

```typescript
// src/components/profile/UserProfile.tsx

import type { User } from "@supabase/supabase-js";

export interface UserProfileProps {
  /** Obiekt użytkownika Supabase przekazany z Astro locals */
  user: User;
}

// Stan lokalny dla procesu wylogowania
export type LogoutState = "idle" | "loading" | "error";
```

## 6. Zarządzanie stanem

Zarządzanie stanem odbywa się lokalnie w komponencie `UserProfile.tsx` przy użyciu `useState`:

- `isLoggingOut` (boolean): Kontroluje stan ładowania przycisku wylogowania (disable button, spinner).

Nie jest wymagany żaden globalny store ani skomplikowane reducery, ponieważ jest to odizolowana funkcjonalność.

## 7. Integracja API

Proces wylogowania wymaga interakcji z Supabase Auth. Ze względu na architekturę SSR i ciasteczka `httpOnly`, najbezpieczniejszą metodą jest wywołanie endpointu API lub użycie klienta Supabase w przeglądarce, który obsłuży sesję.

**Żądanie (Logout):**

- **Metoda:** Wywołanie funkcji klienta Supabase `supabase.auth.signOut()`.
- **Backend:** Supabase Auth automatycznie czyści sesję.
- **API Endpoint (Opcjonalnie):** Jeśli aplikacja używa endpointu do czyszczenia ciasteczek po stronie serwera (np. `/api/auth/signout`), należy wykonać request `POST` lub `GET` na ten endpoint.
  _Zakładając standardową implementację w tym projekcie:_ Użyjemy `createBrowserClient` (jeśli dostępny w `src/lib/supabase-client.ts` lub podobnym) lub metody `POST` do endpointu `/api/auth/signout`.

## 8. Interakcje użytkownika

1. **Wejście na stronę:** Użytkownik widzi swoje dane (Email).
2. **Kliknięcie "Wyloguj":**
   - Przycisk zmienia stan na `disabled` i pokazuje spinner/tekst "Wylogowywanie...".
   - Aplikacja wysyła żądanie zamknięcia sesji.
   - Po sukcesie: Przekierowanie na stronę główną `/` lub `/signin`.
   - Po błędzie: Wyświetlenie powiadomienia (Toast) z błędem.

## 9. Warunki i walidacja

- **Warunek wstępny:** `locals.user` musi istnieć (zapewnione przez Middleware/Astro Page).
- **Walidacja danych:** Sprawdzenie, czy `user.email` jest dostępny do wyświetlenia.

## 10. Obsługa błędów

- **Błąd wylogowania:** Jeśli `signOut` rzuci wyjątek, należy go przechwycić w bloku `try/catch`.
- **UX:** Wyświetlenie komunikatu o błędzie za pomocą komponentu `toast` (sonner), np. "Nie udało się wylogować. Spróbuj ponownie."
- **Fallback:** Jeśli dane użytkownika są niekompletne, wyświetl placeholder w miejscu avatara lub emaila.

## 11. Kroki implementacji

1. **Stworzenie komponentu `UserProfile.tsx`:**
   - Zaimplementowanie UI przy użyciu `Card` i `Button` z Shadcn.
   - Dodanie logiki `handleLogout` wykorzystującej klienta Supabase.
   - Obsługa stanu ładowania.

2. **Stworzenie strony `src/pages/profile.astro`:**
   - Dodanie logiki pobierania `user` z `Astro.locals`.
   - Zabezpieczenie przed brakiem użytkownika (przekierowanie).
   - Zaimportowanie i osadzenie komponentu `UserProfile` (dyrektywa `client:load` lub `client:idle` dla interaktywności przycisku).

3. **Weryfikacja endpointu wylogowania (SignOut):**
   - Upewnienie się, że istnieje mechanizm wylogowania (np. w `src/pages/api/auth/signout.ts` lub obsługa czysto kliencka). Jeśli nie ma endpointu API, zaimplementowanie logiki wylogowania bezpośrednio w komponencie przy użyciu biblioteki klienta.

4. **Dodanie linku do nawigacji (Opcjonalnie):**
   - Jeśli istnieje główny navbar (`Layout.astro` lub komponent `Navigation`), dodanie linku do `/profile` lub obsługa dropdownu użytkownika.
