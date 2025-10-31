# Mock AI Service Documentation

## Overview

The mock AI service provides a development-friendly alternative to the real OpenRouter API, allowing you to develop and test flashcard generation without API costs or network dependencies.

## Features

### 1. Automatic Detection
- **Development Mode**: Mock is automatically enabled when running `npm run dev`
- **Manual Override**: Set `USE_MOCK_AI=true` in `.env` to force mock mode in any environment

### 2. Smart Flashcard Generation

The mock service uses multiple strategies to generate realistic flashcards:

#### a) Concept-Based Recognition
Detects common programming concepts in the input text and generates appropriate flashcards:
- REST, API, JavaScript, TypeScript, React
- Database, Algorithm, Functions
- And more...

#### b) Text Analysis
- Splits text into meaningful chunks (paragraphs, sentences)
- Generates questions based on content structure
- Extracts relevant answers from the text
- Creates 5-20 flashcards per request

#### c) Realistic Behavior
- Simulates network latency (800-2500ms)
- Returns proper `FlashcardProposalDTO[]` format
- Handles edge cases (empty text, very short text)

### 3. Model Compatibility

The mock service accepts the same parameters as the real service:
```typescript
generateFlashcardsMock(text: string, model?: string)
```

The `model` parameter is ignored but kept for API compatibility.

## Usage

### In Development (Automatic)

```bash
# Mock is enabled by default
npm run dev
```

### Force Mock in Production

```bash
# Add to .env
USE_MOCK_AI=true
```

### Testing the Endpoint

```bash
curl -X POST http://localhost:4321/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "REST is an architectural style for designing networked applications. It uses HTTP methods like GET, POST, PUT, and DELETE."
  }'
```

## Example Output

**Input:**
```
REST is an architectural style for designing networked applications.
It uses HTTP methods and stateless communication.
```

**Output:**
```json
{
  "flashcard_proposals": [
    {
      "avers": "What is REST?",
      "rewers": "REST (Representational State Transfer) is an architectural style for designing networked applications, using HTTP methods and stateless communication."
    },
    {
      "avers": "What is the main concept discussed in: REST is an architectural style for designing...",
      "rewers": "REST is an architectural style for designing networked applications. It uses HTTP methods and stateless communication."
    }
  ],
  "generation_duration": 1523,
  "model": "mock-model"
}
```

## Implementation Details

### File Structure
```
src/lib/ai/
├── generation.service.ts       # Real OpenRouter API service
└── generation.service.mock.ts  # Mock service
```

### Endpoint Integration
```typescript
// src/pages/api/flashcards/generate.ts

const USE_MOCK_AI = import.meta.env.DEV || import.meta.env.USE_MOCK_AI === "true";

const flashcardProposals = USE_MOCK_AI
  ? await generateFlashcardsMock(text, modelToUse)
  : await generateFlashcards(text, modelToUse);
```

## Advantages

1. **No API Costs**: Develop without spending money on API calls
2. **Offline Development**: Work without internet connection
3. **Fast Iteration**: No network latency during development
4. **Predictable Results**: Consistent output for testing
5. **No API Key Required**: Get started immediately

## Limitations

1. **Not Production-Ready**: Mock should not be used in production
2. **Simplified Logic**: Doesn't match real AI quality
3. **Limited Concept Detection**: Only recognizes predefined keywords
4. **No Language Understanding**: Pure text processing, no semantic analysis

## Switching to Real API

When you're ready to use the real OpenRouter API:

1. Get an API key from [OpenRouter.ai](https://openrouter.ai/)
2. Add it to your `.env`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
3. Run in production mode or set `USE_MOCK_AI=false`
4. The endpoint will automatically use the real AI service

## Troubleshooting

### Mock not working
- Check that `import.meta.env.DEV` is `true` in development
- Verify the endpoint is importing from `generation.service.mock.ts`
- Check console logs for which service is being used

### Always using real API
- Ensure you're running `npm run dev` not `npm run build && npm run preview`
- Check if `USE_MOCK_AI` is explicitly set to `false` in `.env`

### Flashcards quality is poor
- Remember: Mock uses simple text processing
- For better quality, use the real OpenRouter API
- Mock is intended for development/testing only

