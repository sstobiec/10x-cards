# Schemat Bazy Danych - 10xCards

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

## 4. Indeksy

### 4.1. Indeksy na `flashcard_sets`
```sql
CREATE INDEX idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX idx_flashcard_sets_created_at ON flashcard_sets(created_at DESC);
CREATE UNIQUE INDEX idx_flashcard_sets_user_name ON flashcard_sets(user_id, name);
```

**Uzasadnienie:**
- `idx_flashcard_sets_user_id` - Przyspiesza zapytania pobierające zestawy użytkownika oraz egzekwowanie polityk RLS
- `idx_flashcard_sets_created_at` - Optymalizuje sortowanie chronologiczne (dla widoku listy zestawów)
- `idx_flashcard_sets_user_name` - Wspiera ograniczenie UNIQUE i zapytania wyszukujące po nazwie

### 4.2. Indeksy na `flashcards`
```sql
CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX idx_flashcards_source ON flashcards(source);
CREATE INDEX idx_flashcards_flagged ON flashcards(flagged) WHERE flagged = true;
```

**Uzasadnienie:**
- `idx_flashcards_set_id` - Przyspiesza pobieranie wszystkich fiszek z danego zestawu
- `idx_flashcards_source` - Umożliwia szybkie obliczanie metryk adopcji AI (US-002)
- `idx_flashcards_flagged` - Indeks częściowy dla oflagowanych fiszek (analiza jakości AI)

### 4.3. Indeksy na `error_logs`
```sql
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
```

**Uzasadnienie:**
- `idx_error_logs_user_id` - Zapytania diagnostyczne dla konkretnego użytkownika
- `idx_error_logs_created_at` - Sortowanie chronologiczne logów
- `idx_error_logs_error_type` - Agregacje i analiza typów błędów

---

## 5. Row-Level Security (RLS) Policies

### 5.1. Polityki dla `flashcard_sets`

**Włączenie RLS:**
```sql
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
```

**Polityki:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view their own flashcard sets"
ON flashcard_sets FOR SELECT
USING (auth.uid() = user_id);
```

#### INSERT Policy
```sql
CREATE POLICY "Users can create their own flashcard sets"
ON flashcard_sets FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### UPDATE Policy
```sql
CREATE POLICY "Users can update their own flashcard sets"
ON flashcard_sets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### DELETE Policy
```sql
CREATE POLICY "Users can delete their own flashcard sets"
ON flashcard_sets FOR DELETE
USING (auth.uid() = user_id);
```

---

### 5.2. Polityki dla `flashcards`

**Włączenie RLS:**
```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
```

**Polityki:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view flashcards from their own sets"
ON flashcards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM flashcard_sets
    WHERE flashcard_sets.id = flashcards.set_id
    AND flashcard_sets.user_id = auth.uid()
  )
);
```

#### INSERT Policy
```sql
CREATE POLICY "Users can create flashcards in their own sets"
ON flashcards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM flashcard_sets
    WHERE flashcard_sets.id = flashcards.set_id
    AND flashcard_sets.user_id = auth.uid()
  )
);
```

#### UPDATE Policy
```sql
CREATE POLICY "Users can update flashcards in their own sets"
ON flashcards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM flashcard_sets
    WHERE flashcard_sets.id = flashcards.set_id
    AND flashcard_sets.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM flashcard_sets
    WHERE flashcard_sets.id = flashcards.set_id
    AND flashcard_sets.user_id = auth.uid()
  )
);
```

#### DELETE Policy
```sql
CREATE POLICY "Users can delete flashcards from their own sets"
ON flashcards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM flashcard_sets
    WHERE flashcard_sets.id = flashcards.set_id
    AND flashcard_sets.user_id = auth.uid()
  )
);
```

---

### 5.3. Polityki dla `error_logs`

**Włączenie RLS:**
```sql
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
```

**Polityki:**

#### SELECT Policy
```sql
CREATE POLICY "Users can view their own error logs"
ON error_logs FOR SELECT
USING (auth.uid() = user_id);
```

#### INSERT Policy
```sql
CREATE POLICY "Users can create their own error logs"
ON error_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Uwaga:** Polityki UPDATE i DELETE dla error_logs celowo nie są definiowane - logi powinny być niemodyfikowalne (append-only).

---

## 6. Triggery

### 6.1. Automatyczna aktualizacja `updated_at` dla `flashcard_sets`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcard_sets_updated_at
BEFORE UPDATE ON flashcard_sets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 6.2. Automatyczna aktualizacja `updated_at` dla `flashcards`

```sql
CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 6.3. Automatyczna zmiana `source` przy edycji fiszki AI

```sql
CREATE OR REPLACE FUNCTION update_flashcard_source_on_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Jeśli fiszka była AI-generated i została zmodyfikowana (awers lub rewers)
  IF OLD.source = 'ai-full' AND (OLD.avers != NEW.avers OR OLD.rewers != NEW.rewers) THEN
    NEW.source = 'ai-edited';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcard_source_trigger
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_flashcard_source_on_edit();
```

---

## 7. Dodatkowe Uwagi i Decyzje Projektowe

### 7.1. Uwierzytelnianie i Profil Użytkownika
- Wykorzystujemy wbudowaną tabelę `auth.users` od Supabase, co eliminuje potrzebę tworzenia własnej tabeli użytkowników
- Nazwa użytkownika (`username`) przechowywana jest w `raw_user_meta_data` jako JSON: `{"username": "nazwa"}`
- To podejście jest wystarczające dla MVP i można je łatwo rozszerzyć o dedykowaną tabelę `profiles` w przyszłości, jeśli zajdzie taka potrzeba

### 7.2. Śledzenie Pochodzenia Fiszek (Metryka Adopcji AI)
- Kolumna `source` typu ENUM umożliwia śledzenie, czy fiszka została utworzona ręcznie czy przez AI
- Wartość `ai-edited` jest automatycznie ustawiana przez trigger, gdy użytkownik modyfikuje fiszkę AI
- To rozwiązanie wspiera metrykę sukcesu: "75% wszystkich fiszek w systemie jest tworzonych przy użyciu generatora AI"

### 7.3. Mechanizm Feedback dla Jakości AI (Flagowanie)
- Kolumna `flagged` typu BOOLEAN pozwala użytkownikom oznaczać fiszki niskiej jakości
- Wspiera metrykę sukcesu: "75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika"
- Domyślna wartość `false` zapewnia, że nowe fiszki nie są flagowane

### 7.4. Logowanie Błędów
- Tabela `error_logs` przechowuje szczegółowe informacje o błędach
- `input_payload` (JSONB) może zawierać oryginalny tekst wejściowy, parametry API, itp.

### 7.5. Bezpieczeństwo i Izolacja Danych
- Wszystkie tabele mają włączone RLS (Row-Level Security)
- Polityki zapewniają, że użytkownicy mają dostęp wyłącznie do własnych danych
- Dla tabeli `flashcards` polityki weryfikują własność poprzez JOIN z `flashcard_sets`
- Funkcja `auth.uid()` Supabase zwraca UUID zalogowanego użytkownika

### 7.6. Audyt i Śledzenie Zmian
- Wszystkie tabele mają kolumny `created_at` i `updated_at`
- Triggery automatycznie aktualizują `updated_at` przy każdej modyfikacji
- To standardowa praktyka ułatwiająca debugging i analizę danych

### 7.7. Skalowalność
- Podstawowe indeksy na kluczach obcych zapewnią odpowiednią wydajność dla MVP
- Indeks częściowy na `flagged` optymalizuje zapytania analityczne (rzadko flagowane fiszki)
- Struktura bazy jest łatwo rozszerzalna o przyszłe funkcjonalności (np. `user_flashcard_progress` dla spaced repetition)

### 7.8. Walidacja Danych
- Podstawowa walidacja na poziomie bazy: NOT NULL, CHECK constraints dla pustych stringów
- Bardziej złożona walidacja (np. limit 10,000 znaków przy generowaniu) realizowana po stronie aplikacji
- Limity VARCHAR (200/750) dla `avers`/`rewers` zapewniają rozsądne ograniczenia rozmiaru

### 7.9. Normalizacja
- Schemat jest znormalizowany do 3NF (Third Normal Form)
- Brak denormalizacji, gdyż dla MVP nie jest to uzasadnione
- Relacje są jasno zdefiniowane z odpowiednimi kaskadami

### 7.10. Przyszłe Rozszerzenia (Poza MVP)
Schemat jest zaprojektowany z myślą o łatwym rozszerzeniu o:
- Tabelę `user_flashcard_progress` dla spaced repetition
- Tabelę `profiles` dla rozszerzonego profilu użytkownika
- Tabele dla współdzielenia zestawów (`shared_sets`, `set_permissions`)
- Tabele dla tagów i kategorii (`tags`, `flashcard_tags`)

---

## 8. Podsumowanie Statystyk Schematu

**Liczba tabel:** 3 (+ 1 built-in: auth.users)
- `flashcard_sets`
- `flashcards`
- `error_logs`

**Liczba typów ENUM:** 1
- `flashcard_source`

**Liczba relacji:** 3
- auth.users → flashcard_sets (1:N)
- flashcard_sets → flashcards (1:N)
- auth.users → error_logs (1:N)

**Liczba indeksów:** 10 (3 unique, 1 partial)

**Liczba polityk RLS:** 10
- flashcard_sets: 4 (SELECT, INSERT, UPDATE, DELETE)
- flashcards: 4 (SELECT, INSERT, UPDATE, DELETE)
- error_logs: 2 (SELECT, INSERT)

**Liczba triggerów:** 3
- update_flashcard_sets_updated_at
- update_flashcards_updated_at
- update_flashcard_source_trigger

