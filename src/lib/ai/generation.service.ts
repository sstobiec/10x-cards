/**
 * AI Generation Service
 *
 * This service handles communication with OpenRouter.ai API
 * to generate flashcard proposals from user-provided text.
 */

import type { FlashcardProposalDTO } from "../../types";

// Default AI model to use if not specified
const DEFAULT_MODEL = "openai/gpt-4o";

// Maximum timeout for AI API requests (30 seconds)
const API_TIMEOUT_MS = 30000;

/**
 * Error thrown when AI generation fails
 */
export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

/**
 * Error thrown when AI API is unavailable
 */
export class AIServiceUnavailableError extends AIGenerationError {
  constructor(message: string, originalError?: unknown) {
    super(message, 503, originalError);
    this.name = "AIServiceUnavailableError";
  }
}

/**
 * Creates a prompt for the AI to generate flashcards from text
 */
function createFlashcardGenerationPrompt(text: string): string {
  return `You are a flashcard generation assistant. Your task is to analyze the provided text and extract key concepts, facts, and ideas to create effective flashcards for learning and memorization.

Generate flashcards following these rules:
1. Each flashcard should have a clear question (avers) and a concise answer (rewers)
2. Focus on important concepts, definitions, facts, and relationships
3. Make questions specific and unambiguous
4. Keep answers concise but complete
5. Generate between 5 and 20 flashcards depending on the content length and complexity
6. Return ONLY a valid JSON array with no additional text or markdown formatting

Expected JSON format:
[
  {
    "avers": "Question text here",
    "rewers": "Answer text here"
  }
]

Text to analyze:
${text}

Remember: Return ONLY the JSON array, no markdown code blocks, no explanations.`;
}

/**
 * Validates that the AI response matches the expected flashcard structure
 */
function validateFlashcardProposals(data: unknown): data is FlashcardProposalDTO[] {
  if (!Array.isArray(data)) {
    return false;
  }

  if (data.length === 0) {
    return false;
  }

  return data.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.avers === "string" &&
      typeof item.rewers === "string" &&
      item.avers.length > 0 &&
      item.rewers.length > 0,
  );
}

/**
 * Parses AI response text and extracts JSON array
 * Handles cases where AI returns markdown code blocks
 */
function parseAIResponse(responseText: string): unknown {
  // Remove markdown code blocks if present
  let cleanedText = responseText.trim();

  // Remove ```json and ``` markers
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.slice(7);
  } else if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.slice(3);
  }

  if (cleanedText.endsWith("```")) {
    cleanedText = cleanedText.slice(0, -3);
  }

  cleanedText = cleanedText.trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    throw new AIGenerationError(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : "Unknown error"}`, 500, error);
  }
}

/**
 * Generates flashcard proposals from text using OpenRouter.ai API
 *
 * @param text - The input text to generate flashcards from
 * @param model - The AI model to use (optional, defaults to DEFAULT_MODEL)
 * @returns Promise resolving to array of flashcard proposals
 * @throws {AIGenerationError} When generation fails
 * @throws {AIServiceUnavailableError} When AI service is unavailable
 */
export async function generateFlashcards(
  text: string,
  model: string = DEFAULT_MODEL,
): Promise<FlashcardProposalDTO[]> {
  // Validate API key is configured
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AIGenerationError("OpenRouter API key is not configured", 500);
  }

  // Create the prompt
  const prompt = createFlashcardGenerationPrompt(text);

  // Prepare the request
  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  // Create abort controller for timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), API_TIMEOUT_MS);

  try {
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://10x-cards.app", // Optional: For OpenRouter analytics
        "X-Title": "10x Cards", // Optional: For OpenRouter analytics
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");

      // Service unavailable errors
      if (response.status === 503 || response.status === 502 || response.status === 504) {
        throw new AIServiceUnavailableError(`AI service is temporarily unavailable: ${errorText}`);
      }

      // Other errors
      throw new AIGenerationError(
        `OpenRouter API returned error ${response.status}: ${errorText}`,
        response.status,
      );
    }

    // Parse response
    const responseData = await response.json();

    // Extract content from OpenRouter response format
    const content = responseData?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new AIGenerationError("Invalid response format from OpenRouter API - missing content", 500);
    }

    // Parse and validate the AI response
    const parsedData = parseAIResponse(content);

    if (!validateFlashcardProposals(parsedData)) {
      throw new AIGenerationError(
        "AI returned invalid flashcard format or empty array",
        500,
        parsedData,
      );
    }

    return parsedData;
  } catch (error) {
    clearTimeout(timeoutId);

    // Re-throw our custom errors
    if (error instanceof AIGenerationError) {
      throw error;
    }

    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIServiceUnavailableError("Request to AI service timed out after 30 seconds");
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new AIServiceUnavailableError("Failed to connect to AI service", error);
    }

    // Unknown errors
    throw new AIGenerationError(
      `Unexpected error during AI generation: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
      error,
    );
  }
}

