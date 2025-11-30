/**
 * Flashcard Generation API Service
 *
 * Client-side API service for flashcard generation and set creation.
 * Handles HTTP requests, error transformation, and response typing.
 */

import type {
  GenerateFlashcardsRequestDTO,
  GenerateFlashcardsResponseDTO,
  CreateFlashcardSetRequestDTO,
  CreateFlashcardSetResponseDTO,
} from "@/types";

/**
 * Custom error class for flashcard generation API errors
 * Provides structured error information including HTTP status and error code
 */
export class FlashcardGenerationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "FlashcardGenerationApiError";
  }
}

/**
 * Generates flashcard proposals from input text using AI
 *
 * @param request - The generation request containing input text
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to generated flashcard proposals
 * @throws {FlashcardGenerationApiError} When the API request fails
 */
export async function generateFlashcards(
  request: GenerateFlashcardsRequestDTO,
  signal?: AbortSignal
): Promise<GenerateFlashcardsResponseDTO> {
  const response = await fetch("/api/flashcards/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new FlashcardGenerationApiError(
      errorData.error?.message || "Nie udało się wygenerować fiszek",
      response.status,
      errorData.error?.code
    );
  }

  return response.json();
}

/**
 * Creates a new flashcard set with the provided flashcards
 *
 * @param request - The set creation request containing name, metadata, and flashcards
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to the created flashcard set info
 * @throws {FlashcardGenerationApiError} When the API request fails (including 409 for duplicate names)
 */
export async function createFlashcardSet(
  request: CreateFlashcardSetRequestDTO,
  signal?: AbortSignal
): Promise<CreateFlashcardSetResponseDTO> {
  const response = await fetch("/api/flashcard-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      response.status === 409
        ? "Zestaw o tej nazwie już istnieje."
        : errorData.error?.message || "Nie udało się zapisać zestawu";

    throw new FlashcardGenerationApiError(message, response.status, errorData.error?.code);
  }

  return response.json();
}
