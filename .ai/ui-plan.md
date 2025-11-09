# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji 10xCards została zaprojektowana w oparciu o framework Astro, z wykorzystaniem komponentów React do obsługi dynamicznych i interaktywnych części aplikacji. Główne założenia to modularność, reużywalność komponentów oraz zapewnienie intuicyjnego i płynnego doświadczenia użytkownika (UX).

Struktura opiera się na kilku kluczowych widokach (stronach Astro), które odpowiadają za poszczególne etapy pracy z aplikacją: od autentykacji, przez zarządzanie zestawami fiszek, aż po ich tworzenie. Centralnym elementem jest reużywalny komponent `SetEditor`, który adaptuje swoje działanie w zależności od kontekstu — recenzji nowo wygenerowanych fiszek lub edycji istniejącego zestawu.

Zarządzanie stanem globalnym (sesja użytkownika) będzie realizowane przy pomocy biblioteki Zustand, natomiast stany tymczasowe, takie jak lista propozycji fiszek AI przed zapisem, będą zarządzane lokalnie w komponentach. Bezpieczeństwo chronionych widoków zapewni dedykowany layout w Astro, który będzie weryfikował status autentykacji po stronie serwera.

## 2. Lista widoków

### Widok 1: Autentykacja
- **Nazwa widoku:** `AuthenticationView`
- **Ścieżka widoku:** `/auth`
- **Główny cel:** Umożliwienie użytkownikom rejestracji nowego konta oraz logowania do istniejącego.
- **Kluczowe informacje do wyświetlenia:**
    - Formularz logowania (email/hasło).
    - Formularz rejestracji (email/hasło).
    - Komunikaty o błędach walidacji (np. "Nieprawidłowe hasło", "Użytkownik już istnieje").
- **Kluczowe komponenty widoku:**
    - `Tabs`: Przełącznik między formularzem logowania a rejestracji.
    - `AuthForm`: Komponent formularza z logiką walidacji po stronie klienta.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Jasne rozdzielenie logowania od rejestracji. Natychmiastowa walidacja pól formularza.
    - **Dostępność:** (Poza zakresem MVP) Należy zadbać o etykiety dla pól i obsługę z klawiatury.
    - **Bezpieczeństwo:** Komunikacja z API autentykacji odbywa się przez HTTPS. Strona jest publiczna.

### Widok 2: Pulpit
- **Nazwa widoku:** `DashboardView`
- **Ścieżka widoku:** `/dashboard`
- **Główny cel:** Centralne miejsce do zarządzania wszystkimi zestawami fiszek użytkownika oraz inicjowania procesu tworzenia nowych.
- **Kluczowe informacje do wyświetlenia:**
    - Paginowana lista istniejących zestawów fiszek.
    - Dla każdego zestawu: nazwa, liczba fiszek, data utworzenia.
    - Przyciski akcji dla każdego zestawu: "Ucz się", "Edytuj", "Usuń".
    - W przypadku braku zestawów: komunikat o stanie pustym z wezwaniem do akcji.
- **Kluczowe komponenty widoku:**
    - `FlashcardSetCard`: Karta reprezentująca pojedynczy zestaw na liście.
    - `Pagination`: Komponent do nawigacji między stronami listy.
    - `AlertDialog`: Modal z prośbą o potwierdzenie przed usunięciem zestawu.
    - `Button`: Główne przyciski "Generuj z tekstu" i "Stwórz ręcznie".
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Czytelna lista zestawów, łatwy dostęp do kluczowych akcji. Jasna informacja zwrotna po wykonaniu operacji (np. usunięciu zestawu).
    - **Dostępność:** (Poza zakresem MVP) Wszystkie akcje powinny być dostępne z klawiatury.
    - **Bezpieczeństwo:** Widok chroniony, dostępny tylko dla zalogowanych użytkowników. Weryfikacja sesji odbywa się po stronie serwera.

### Widok 3: Generator AI
- **Nazwa widoku:** `GenerationView`
- **Ścieżka widoku:** `/generate`
- **Główny cel:** Umożliwienie użytkownikowi wklejenia tekstu, wygenerowania propozycji fiszek za pomocą AI, a następnie ich przejrzenia, edycji i zapisania jako nowy zestaw.
- **Kluczowe informacje do wyświetlenia:**
    - Pole tekstowe (`Textarea`) na notatki z dynamicznym licznikiem znaków.
    - Po wygenerowaniu: pole na nazwę zestawu i lista propozycji fiszek.
- **Kluczowe komponenty widoku:**
    - `Textarea`: Z walidacją limitu 10 000 znaków.
    - `Button`: Przycisk "Generuj fiszki" ze wskaźnikiem ładowania.
    - `SetEditor`: W trybie `review` do zarządzania propozycjami fiszek.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Płynne przejście od wprowadzania tekstu do recenzji fiszek w ramach jednego widoku. Jasny feedback o stanie ładowania.
    - **Dostępność:** (Poza zakresem MVP) Fokus powinien być zarządzany dynamicznie po zmianie stanu widoku.
    - **Bezpieczeństwo:** Widok chroniony. Dane wejściowe walidowane po stronie klienta i serwera.

### Widok 4: Edytor Zestawu
- **Nazwa widoku:** `SetEditorView`
- **Ścieżka widoku:** `/sets/[id]`
- **Główny cel:** Edycja istniejącego zestawu fiszek: zmiana nazwy, dodawanie nowych fiszek ręcznie, edycja i usuwanie istniejących.
- **Kluczowe informacje do wyświetlenia:**
    - Edytowalna nazwa zestawu.
    - Formularz do dodawania nowej fiszki (awers/rewers).
    - Lista wszystkich fiszek w zestawie.
- **Kluczowe komponenty widoku:**
    - `SetEditor`: W trybie `edit` do zarządzania zapisanymi fiszkami.
    - `AddFlashcardForm`: Formularz do ręcznego dodawania kart.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Wszystkie narzędzia do edycji zestawu dostępne w jednym miejscu. Zmiany w pojedynczych fiszkach są zapisywane asynchronicznie, dając wrażenie płynności.
    - **Dostępność:** (Poza zakresem MVP) Zapewnienie dostępności dla dynamicznie dodawanych i edytowanych elementów.
    - **Bezpieczeństwo:** Widok chroniony. Dostęp do zestawu jest weryfikowany przez RLS w bazie danych.

### Widok 5: Profil Użytkownika
- **Nazwa widoku:** `ProfileView`
- **Ścieżka widoku:** `/profile`
- **Główny cel:** Wyświetlenie podstawowych informacji o koncie i umożliwienie wylogowania.
- **Kluczowe informacje do wyświetlenia:**
    - Nazwa użytkownika/email.
    - Przycisk "Wyloguj".
- **Kluczowe komponenty widoku:**
    - `Button`: Do akcji wylogowania.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Prosty i jednoznaczny interfejs.
    - **Dostępność:** (Poza zakresem MVP) Standardowe wymagania dla prostych stron.
    - **Bezpieczeństwo:** Widok chroniony.

## 3. Mapa podróży użytkownika

Opisuje dwa kluczowe przepływy pracy w aplikacji:

**A. Generowanie zestawu fiszek za pomocą AI:**
1.  **`/auth` -> `/dashboard`**: Użytkownik loguje się i trafia na pulpit.
2.  **`/dashboard`**: Klika przycisk "Generuj z tekstu".
3.  **`-> /generate`**: Zostaje przekierowany do widoku generatora. Wkleja tekst, klika "Generuj fiszki" i czeka na zakończenie operacji (widzi wskaźnik ładowania).
4.  **`/generate` (stan po generacji)**: Widok dynamicznie się zmienia, wyświetlając listę propozycji. Użytkownik przegląda, edytuje lub usuwa fiszki, nadaje zestawowi nazwę i klika "Zapisz zestaw".
5.  **`-> /dashboard`**: Po pomyślnym zapisie zostaje przekierowany z powrotem na pulpit, gdzie nowy zestaw jest widoczny na liście.

**B. Ręczne tworzenie i edycja zestawu:**
1.  **`/auth` -> `/dashboard`**: Użytkownik loguje się i trafia na pulpit.
2.  **`/dashboard`**: Klika przycisk "Stwórz ręcznie". Pojawia się modal z prośbą o podanie nazwy nowego zestawu.
3.  **`-> /sets/[id]`**: Po podaniu nazwy i zatwierdzeniu, zostaje przekierowany do widoku edytora dla nowo utworzonego, pustego zestawu.
4.  **`/sets/[id]`**: Używa formularza, aby dodawać fiszki jedna po drugiej. Może również edytować lub usuwać już dodane fiszki. Wszystkie zmiany są zapisywane na bieżąco.
5.  **(Nawigacja) -> `/dashboard`**: Użytkownik wraca na pulpit, gdzie widzi swój nowy, ręcznie stworzony zestaw.

## 4. Układ i struktura nawigacji

- **Główny Layout (`MainLayout.astro`):** Wspólna struktura dla wszystkich stron, zawierająca nagłówek i stopkę.
- **Layout Chroniony (`ProtectedLayout.astro`):** "Obudowa" dla widoków wymagających zalogowania (`/dashboard`, `/generate`, `/sets/[id]`, `/profile`). Sprawdza sesję użytkownika po stronie serwera i w razie potrzeby przekierowuje na `/auth`.
- **Nawigacja główna (`Header.astro`):**
    - Wyświetlana na wszystkich chronionych stronach.
    - Zawiera logo (link do `/dashboard`), linki do kluczowych widoków ("Pulpit", "Generuj") oraz menu użytkownika z linkiem do profilu i przyciskiem wylogowania.
- **Brak nawigacji:** Na stronie `/auth` nie ma głównej nawigacji, aby skupić użytkownika na zadaniu.

## 5. Kluczowe komponenty

Poniżej lista kluczowych, reużywalnych komponentów, które będą stanowić fundament interfejsu użytkownika:

- **`SetEditor` (React):**
    - **Opis:** Dynamiczny komponent do wyświetlania i zarządzania listą fiszek. Działa w dwóch trybach: `review` (dla propozycji AI, zarządza stanem lokalnie) i `edit` (dla istniejących zestawów, komunikuje się z API przy każdej zmianie).
- **`FlashcardEditable` (React):**
    - **Opis:** Komponent reprezentujący pojedynczą fiszkę wewnątrz `SetEditor`. Umożliwia edycję treści awersu i rewersu oraz zawiera przyciski akcji (usuń, oznacz jako słabą).
- **`ToastProvider` (React):**
    - **Opis:** Globalny system powiadomień (tzw. "toasts") do informowania użytkownika o ogólnych błędach serwera (5xx) lub o powodzeniu ważnych operacji.
- **`Header` (Astro/React):**
    - **Opis:** Główny pasek nawigacyjny aplikacji, widoczny dla zalogowanych użytkowników.
- **Komponenty UI z biblioteki (Shadcn/ui):**
    - **Opis:** Gotowe, stylizowane komponenty takie jak `Button`, `Input`, `Textarea`, `Card`, `Tabs`, `AlertDialog`, które zapewnią spójny wygląd i przyspieszą rozwój interfejsu.
