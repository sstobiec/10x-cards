# Przewodnik Implementacji Usługi OpenRouter

Niniejszy dokument stanowi kompleksowy przewodnik dla deweloperów w celu wdrożenia usługi `OpenRouterService` w aplikacji opartej na Astro i TypeScript. Usługa ta będzie odpowiedzialna za komunikację z API OpenRouter w celu generowania ustrukturyzowanych odpowiedzi od modeli językowych.

## 1. Opis usługi

`OpenRouterService` to klasa TypeScript, która enkapsuluje logikę interakcji z API OpenRouter. Jej głównym zadaniem jest wysyłanie zapytań do modeli językowych (LLM) i otrzymywanie odpowiedzi w ściśle określonym formacie JSON, zgodnie z podanym schematem. Usługa zarządza konfiguracją, budowaniem żądań, komunikacją sieciową, parsowaniem odpowiedzi oraz obsługą błędów.

## 2. Opis konstruktora

Konstruktor inicjalizuje usługę, wczytując konfigurację, taką jak klucz API, z bezpiecznego miejsca (zmiennych środowiskowych).

```typescript
// Przykład użycia
import { OpenRouterService } from './openrouter.service';

try {
  const openRouterService = new OpenRouterService();
  // ... dalsze użycie
} catch (error) {
  console.error('Błąd inicjalizacji usługi:', error);
}
```

Konstruktor powinien zweryfikować obecność klucza API i rzucić błąd typu `ConfigurationError`, jeśli go brakuje, aby zapobiec nieprawidłowemu działaniu usługi w dalszej części jej cyklu życia.

## 3. Publiczne metody i pola

### `generateStructuredResponse<T>(params: GenerationParams): Promise<T>`

Jest to główna i jedyna publiczna metoda usługi. Jest generyczna i zwraca `Promise`, który rozwiązuje się do obiektu zgodnego z typem `T`.

**Parametry:**

Obiekt `GenerationParams` o następującej strukturze:

- `systemPrompt` (string): Instrukcja systemowa dla modelu, definiująca jego rolę i zadanie.
- `userPrompt` (string): Zapytanie od użytkownika.
- `schema` (Zod.Schema<T>): Schemat Zod definiujący oczekiwaną strukturę odpowiedzi.
- `modelName?` (string): Opcjonalna nazwa modelu OpenRouter (np. `'openai/gpt-4o'`). Jeśli nie zostanie podana, użyty zostanie model domyślny.
- `modelParams?` (object): Opcjonalne parametry modelu, takie jak `temperature`, `max_tokens` itp.

**Zwraca:**

`Promise<T>`: Obiekt `Promise`, który po pomyślnym rozwiązaniu zawiera odpowiedź z API, sparsowaną i zwalidowaną zgodnie z podanym schematem Zod. W przypadku błędu `Promise` zostanie odrzucony z odpowiednim niestandardowym błędem (np. `ApiError`, `ValidationError`).

## 4. Prywatne metody i pola

### Pola prywatne

- `#apiKey` (string): Klucz API do OpenRouter, przechowywany prywatnie.
- `#baseUrl` (string): Stały adres URL do API OpenRouter.

### Metody prywatne

- `#buildRequestBody(params)`: Buduje ciało żądania (payload) na podstawie parametrów przekazanych do metody publicznej. Konwertuje schemat Zod na JSON Schema i formatuje tablicę `messages`.
- `#sendRequest(body)`: Wysyła żądanie POST do API OpenRouter, używając `fetch`. Obsługuje dodawanie nagłówków autoryzacyjnych.
- `#parseAndValidateResponse<T>(response, schema)`: Parsuje odpowiedź z API, a następnie waliduje ją względem dostarczonego schematu Zod, zapewniając bezpieczeństwo typów.

## 5. Obsługa błędów

Usługa będzie wykorzystywać niestandardowe klasy błędów, aby umożliwić precyzyjne ich przechwytywanie i obsługę w warstwie wywołującej.

- **`ConfigurationError`**: Rzucany przez konstruktor, jeśli brakuje kluczowych zmiennych środowiskowych (np. `OPENROUTER_API_KEY`).
- **`ValidationError`**: Rzucany, gdy dane wejściowe (np. `userPrompt`) są nieprawidłowe lub gdy odpowiedź z API nie pasuje do oczekiwanego schematu.
- **`ApiError`**: Rzucany w przypadku błędów komunikacji z API OpenRouter (np. błędy sieci, statusy 4xx/5xx). Zawiera oryginalny status i komunikat błędu z API.

## 6. Kwestie bezpieczeństwa

- **Zarządzanie kluczem API**: Klucz API OpenRouter **nigdy** nie może być umieszczony bezpośrednio w kodzie. Musi być przechowywany w zmiennych środowiskowych (plik `.env`) i wczytywany po stronie serwera. Plik `.env` musi być dodany do `.gitignore`, aby uniknąć jego wycieku do repozytorium.
- **Walidacja wejścia**: Wszystkie dane pochodzące od użytkownika (`userPrompt`) muszą być traktowane jako niezaufane. Chociaż w tym przypadku są one przekazywane do LLM, należy unikać ich bezpośredniego użycia w kontekstach wrażliwych na bezpieczeństwo (np. zapytania do bazy danych) bez uprzedniej sanityzacji.
- **Walidacja wyjścia**: Odpowiedzi z API LLM są również niezaufane. Użycie Zod do walidacji schematu odpowiedzi jest kluczowe dla zapewnienia, że dalsze części aplikacji operują na danych o przewidywalnej i bezpiecznej strukturze.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Konfiguracja środowiska

1.  Zainstaluj wymagane zależności:
    ```bash
    npm install zod zod-to-json-schema
    ```
2.  Utwórz plik `.env` w głównym katalogu projektu i dodaj swój klucz API:
    ```
    OPENROUTER_API_KEY="sk-or-v1-..."
    ```
3.  Upewnij się, że plik `.env` jest dodany do `.gitignore`.

### Krok 2: Definicja schematów i typów

W pliku `src/types.ts` zdefiniuj schematy Zod dla danych, które chcesz otrzymywać z API.

```typescript:src/types.ts
import { z } from 'zod';

// Schemat pojedynczej fiszki
export const FlashcardSchema = z.object({
  question: z.string().describe('Pytanie, które pojawi się na awersie fiszki.'),
  answer: z.string().describe('Odpowiedź, która pojawi się na rewersie fiszki.'),
});

// Schemat całego zestawu fiszek
export const FlashcardSetSchema = z.object({
  topic: z.string().describe('Główny temat wygenerowanego zestawu fiszek.'),
  flashcards: z
    .array(FlashcardSchema)
    .min(1)
    .describe('Lista co najmniej jednej fiszki.'),
});

// Wyprowadzenie typów TypeScript ze schematów
export type Flashcard = z.infer<typeof FlashcardSchema>;
export type FlashcardSet = z.infer<typeof FlashcardSetSchema>;
```

### Krok 3: Stworzenie niestandardowych błędów

Utwórz plik `src/lib/ai/errors.ts` do przechowywania niestandardowych klas błędów.

```typescript:src/lib/ai/errors.ts
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ApiError extends Error {
  public status: number;
  public details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
```

### Krok 4: Implementacja `OpenRouterService`

Utwórz plik `src/lib/ai/openrouter.service.ts` i zaimplementuj klasę.

```typescript:src/lib/ai/openrouter.service.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ApiError, ConfigurationError, ValidationError } from './errors';

// Definicja typów dla parametrów i ciała żądania
interface GenerationParams<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.Schema<T>;
  modelName?: string;
  modelParams?: Record<string, unknown>;
}

interface OpenRouterRequestBody {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  response_format: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: object;
    };
  };
  [key: string]: unknown; // Umożliwia dodanie dodatkowych parametrów modelu
}

export class OpenRouterService {
  #apiKey: string;
  #baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.#apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!this.#apiKey) {
      throw new ConfigurationError('Brak klucza OPENROUTER_API_KEY w zmiennych środowiskowych.');
    }
  }

  public async generateStructuredResponse<T>({
    systemPrompt,
    userPrompt,
    schema,
    modelName = 'openai/gpt-4o',
    modelParams = {},
  }: GenerationParams<T>): Promise<T> {
    if (!userPrompt) {
      throw new ValidationError('Pusty userPrompt jest niedozwolony.');
    }

    const requestBody = this.#buildRequestBody(systemPrompt, userPrompt, schema, modelName, modelParams);
    
    const response = await this.#sendRequest(requestBody);

    return this.#parseAndValidateResponse(response, schema);
  }

  #buildRequestBody<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.Schema<T>,
    modelName: string,
    modelParams: Record<string, unknown>
  ): OpenRouterRequestBody {
    const schemaName = 'StructuredResponse';
    const jsonSchema = zodToJsonSchema(schema, schemaName);

    return {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          strict: true,
          schema: jsonSchema.definitions?.[schemaName] ?? {},
        },
      },
      ...modelParams,
    };
  }
  
  async #sendRequest(body: OpenRouterRequestBody): Promise<Response> {
    try {
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.#apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(`Błąd API OpenRouter: ${response.statusText}`, response.status, errorData);
      }
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Błąd sieci podczas komunikacji z OpenRouter.', 500, error);
    }
  }

  async #parseAndValidateResponse<T>(response: Response, schema: z.Schema<T>): Promise<T> {
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      throw new ValidationError('Odpowiedź API nie jest prawidłowym formatem JSON.');
    }

    const content = responseData?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new ValidationError('Brak zawartości w odpowiedzi API.');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      throw new ValidationError('Zawartość odpowiedzi nie jest prawidłowym obiektem JSON.');
    }
    
    const validationResult = schema.safeParse(parsedContent);
    if (!validationResult.success) {
      throw new ValidationError(`Odpowiedź API nie przeszła walidacji schematu: ${validationResult.error.message}`);
    }

    return validationResult.data;
  }
}
```

### Krok 5: Użycie usługi w endpoint'cie API Astro

Na koniec, użyj nowo utworzonej usługi w swoim endpoint'cie API. Przykład dla `src/pages/api/flashcards/generate.ts`:

```typescript:src/pages/api/flashcards/generate.ts
import type { APIRoute } from 'astro';
import { OpenRouterService } from '../../../lib/ai/openrouter.service';
import { FlashcardSetSchema } from '../../../types';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const topic = body.topic;

    if (!topic || typeof topic !== 'string') {
      return new Response(JSON.stringify({ error: 'Nieprawidłowy temat.' }), { status: 400 });
    }

    const openRouterService = new OpenRouterService();
    
    const flashcardSet = await openRouterService.generateStructuredResponse({
      systemPrompt: 'Jesteś ekspertem w tworzeniu materiałów do nauki. Twoim zadaniem jest wygenerowanie zestawu fiszek na podany temat. Odpowiedź musi być wyłącznie w formacie JSON zgodnym z dostarczonym schematem.',
      userPrompt: `Wygeneruj dla mnie 5 fiszek na temat: "${topic}".`,
      schema: FlashcardSetSchema,
    });

    return new Response(JSON.stringify(flashcardSet), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    // Logowanie błędu
    console.error(`[API /flashcards/generate] Błąd: ${error.message}`);

    const status = error.status || 500;
    return new Response(JSON.stringify({ error: error.message }), { status });
  }
};
```
