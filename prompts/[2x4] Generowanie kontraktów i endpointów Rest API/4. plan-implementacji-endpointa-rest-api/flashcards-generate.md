Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
<route_api_specification>
#### Generate Flashcard Proposals from Text
- **Method:** POST
- **Path:** `/api/flashcards/generate`
- **Description:** Generate flashcards from text input using AI (temporary preview, not saved)
- **Authentication:** Required (JWT)
- **Request Body:**
```json
{
  "text": "String of notes/content to generate flashcards from",
  "model": "openai/gpt-4o" 
}
```
- **Validation:**
  - `text`: required, max 10,000 characters
  - `model`: optional, defaults to configured model
- **Success Response:** `200 OK`
```json
{
  "flashcard_proposals": [
    {
      "avers": "What is REST?",
      "rewers": "REST (Representational State Transfer) is an architectural style for distributed hypermedia systems."
    },
    {
      "avers": "What are HTTP methods?",
      "rewers": "GET, POST, PUT, DELETE, PATCH are common HTTP methods used in REST APIs."
    }
  ],
  "generation_duration": 2500,
  "model": "openai/gpt-4o"
}
```
- **Error Responses:**
  - `400 Bad Request` - Text exceeds 10,000 characters or validation failed
  - `401 Unauthorized` - Invalid or missing JWT token
  - `422 Unprocessable Entity` - Invalid input format
  - `500 Internal Server Error` - AI generation failed
  - `503 Service Unavailable` - AI service temporarily unavailable

**Note:** When AI generation fails, error details should be logged to `error_logs` table with input_payload containing the request text.
</route_api_specification>

2. Related database resources:
<related_db_resources>
## 1. Tabele

### 1.1. `auth.users` (Supabase Built-in)
Tabela zarządzana przez Supabase Auth. Przechowuje dane uwierzytelniające użytkowników.

**Kolumny wykorzystywane:**
- `id` (UUID, PRIMARY KEY) - Unikalny identyfikator użytkownika
- `email` (VARCHAR) - Adres email użytkownika
- `encrypted_password` (VARCHAR) - Zaszyfrowane hasło
- `raw_user_meta_data` (JSONB) - Metadane użytkownika, w tym:
  - `username` (string) - Nazwa użytkownika
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

---

### 1.2. `flashcard_sets`
Przechowuje zestawy fiszek należące do użytkowników.

**Kolumny:**
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FOREIGN KEY → auth.users.id)
- `name` (VARCHAR(100), NOT NULL)
- `model` (VARCHAR(100), NOT NULL)
- `generation_duration` (INTEGER, NOT NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW())


**Ograniczenia:**
- `UNIQUE(user_id, name)` - Zapewnia unikalność nazwy zestawu dla każdego użytkownika
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` - Kaskadowe usuwanie zestawów przy usunięciu użytkownika

---

### 1.3. `flashcards`
Przechowuje pojedyncze fiszki w ramach zestawów.

**Kolumny:**
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `set_id` (UUID, NOT NULL, FOREIGN KEY → flashcard_sets.id)
- `avers` (VARCHAR(200), NOT NULL)
- `rewers` (VARCHAR(750), NOT NULL)
- `source` (flashcard_source ENUM, NOT NULL)
- `flagged` (BOOLEAN, NOT NULL, DEFAULT false)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW())

**Ograniczenia:**
- `FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE` - Kaskadowe usuwanie fiszek przy usunięciu zestawu
- `CHECK (LENGTH(TRIM(avers)) > 0)` - Awers nie może być pusty
- `CHECK (LENGTH(TRIM(rewers)) > 0)` - Rewers nie może być pusty

---

### 1.4. `error_logs`
Rejestruje błędy występujące podczas operacji na zestawach fiszek (głównie podczas generowania przez AI).

**Kolumny:**
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FOREIGN KEY → auth.users.id)
- `model` (VARCHAR(100), NOT NULL)
- `error_type` (VARCHAR(100), NOT NULL)
- `error_message` (TEXT, NOT NULL)
- `input_payload` (JSONB, NULLABLE)
- `created_at` (TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT NOW())

**Ograniczenia:**
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`

---

## 2. Typy Wyliczeniowe (ENUMs)

### 2.1. `flashcard_source`
Określa pochodzenie fiszki.

**Wartości:**
- `'manual'` - Fiszka utworzona ręcznie przez użytkownika
- `'ai-full'` - Fiszka wygenerowana przez AI i niemodyfikowana
- `'ai-edited'` - Fiszka wygenerowana przez AI i następnie edytowana przez użytkownika

**Definicja SQL:**
```sql
CREATE TYPE flashcard_source AS ENUM ('manual', 'ai-full', 'ai-edited');
```

---

## 3. Relacje między Tabelami

### 3.1. `auth.users` → `flashcard_sets`
- **Typ relacji:** Jeden-do-wielu (1:N)
- **Opis:** Jeden użytkownik może mieć wiele zestawów fiszek
- **Klucz obcy:** `flashcard_sets.user_id` → `auth.users.id`
- **Kaskada:** `ON DELETE CASCADE` - Usunięcie użytkownika usuwa wszystkie jego zestawy

### 3.2. `flashcard_sets` → `flashcards`
- **Typ relacji:** Jeden-do-wielu (1:N)
- **Opis:** Jeden zestaw może zawierać wiele fiszek
- **Klucz obcy:** `flashcards.set_id` → `flashcard_sets.id`
- **Kaskada:** `ON DELETE CASCADE` - Usunięcie zestawu usuwa wszystkie zawarte w nim fiszki

### 3.3. `auth.users` → `error_logs`
- **Typ relacji:** Jeden-do-wielu (1:N)
- **Opis:** Jeden użytkownik może mieć wiele logów błędów
- **Klucz obcy:** `error_logs.user_id` → `auth.users.id`
- **Kaskada:** `ON DELETE CASCADE` - Usunięcie użytkownika usuwa jego logi błędów

---

</related_db_resources>

3. Definicje typów:
<type_definitions>
@types.ts 
</type_definitions>

3. Tech stack:
<tech_stack>
@tech-stack.md 
</tech_stack>

4. Implementation rules:
<implementation_rules>
@shared.mdc @backend.mdc @astro.mdc 
</implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu interfejsu API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (istniejącego lub nowego, jeśli nie istnieje).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API endpointa, zasobami bazy danych i regułami implementacji.
6. Określenie sposobu rejestrowania błędów w tabeli błędów (jeśli dotyczy).
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa w oparciu o specyfikację API i stack technologiczny.
8. Nakreśl potencjalne scenariusze błędów i odpowiadające im kody stanu.

Po przeprowadzeniu analizy utwórz szczegółowy plan wdrożenia w formacie markdown. Plan powinien zawierać następujące sekcje:

1. Przegląd punktu końcowego
2. Szczegóły żądania
3. Szczegóły odpowiedzi
4. Przepływ danych
5. Względy bezpieczeństwa
6. Obsługa błędów
7. Wydajność
8. Kroki implementacji

W całym planie upewnij się, że
- Używać prawidłowych kodów stanu API:
  - 200 dla pomyślnego odczytu
  - 201 dla pomyślnego utworzenia
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych zasobów
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown. Oto przykład tego, jak powinny wyglądać dane wyjściowe:

``markdown
# API Endpoint Implementation Plan: [Nazwa punktu końcowego]

## 1. Przegląd punktu końcowego
[Krótki opis celu i funkcjonalności punktu końcowego]

## 2. Szczegóły żądania
- Metoda HTTP: [GET/POST/PUT/DELETE]
- Struktura URL: [wzorzec URL]
- Parametry:
  - Wymagane: [Lista wymaganych parametrów]
  - Opcjonalne: [Lista opcjonalnych parametrów]
- Request Body: [Struktura treści żądania, jeśli dotyczy]

## 3. Wykorzystywane typy
[DTOs i Command Modele niezbędne do implementacji]

## 3. Szczegóły odpowiedzi
[Oczekiwana struktura odpowiedzi i kody statusu]

## 4. Przepływ danych
[Opis przepływu danych, w tym interakcji z zewnętrznymi usługami lub bazami danych]

## 5. Względy bezpieczeństwa
[Szczegóły uwierzytelniania, autoryzacji i walidacji danych]

## 6. Obsługa błędów
[Lista potencjalnych błędów i sposób ich obsługi]

## 7. Rozważania dotyczące wydajności
[Potencjalne wąskie gardła i strategie optymalizacji]

## 8. Etapy wdrożenia
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]
...
```

Końcowe wyniki powinny składać się wyłącznie z planu wdrożenia w formacie markdown i nie powinny powielać ani powtarzać żadnej pracy wykonanej w sekcji analizy.

Pamiętaj, aby zapisać swój plan wdrożenia jako .ai/view-implementation-plan.md. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów.