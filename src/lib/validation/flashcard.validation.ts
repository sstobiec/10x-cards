/**
 * Flashcard Validation Schemas
 *
 * Centralized Zod validation schemas for flashcard content.
 * Used by components and hooks to ensure consistent validation.
 */

import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

export const AVERS_MAX_LENGTH = 200;
export const REWERS_MAX_LENGTH = 750;

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for validating flashcard front (avers/question)
 * - Must not be empty (after trimming)
 * - Must not exceed AVERS_MAX_LENGTH characters
 */
export const FlashcardAversSchema = z
  .string()
  .min(1, "Awers nie może być pusty")
  .max(AVERS_MAX_LENGTH, `Przekroczono limit ${AVERS_MAX_LENGTH} znaków`)
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Awers nie może być pusty");

/**
 * Schema for validating flashcard back (rewers/answer)
 * - Must not be empty (after trimming)
 * - Must not exceed REWERS_MAX_LENGTH characters
 */
export const FlashcardRewersSchema = z
  .string()
  .min(1, "Rewers nie może być pusty")
  .max(REWERS_MAX_LENGTH, `Przekroczono limit ${REWERS_MAX_LENGTH} znaków`)
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Rewers nie może być pusty");

/**
 * Schema for validating flashcard source
 */
export const FlashcardSourceSchema = z.enum(["manual", "ai-full", "ai-edited"]);

/**
 * Combined schema for editing a flashcard
 */
export const FlashcardEditSchema = z.object({
  avers: FlashcardAversSchema,
  rewers: FlashcardRewersSchema,
});

export type FlashcardEditFormData = z.infer<typeof FlashcardEditSchema>;

// ============================================================================
// API Request Schemas
// ============================================================================

/**
 * Schema for creating a new flashcard
 * POST /api/flashcard-sets/:setId/flashcards
 */
export const CreateFlashcardSchema = z.object({
  avers: FlashcardAversSchema,
  rewers: FlashcardRewersSchema,
  source: FlashcardSourceSchema,
});

/**
 * Schema for updating an existing flashcard
 * PATCH /api/flashcards/:id
 */
export const UpdateFlashcardSchema = z.object({
  avers: FlashcardAversSchema.optional(),
  rewers: FlashcardRewersSchema.optional(),
});

/**
 * Schema for toggling flashcard flag
 * PATCH /api/flashcards/:id/flag
 */
export const ToggleFlashcardFlagSchema = z.object({
  flagged: z.boolean(),
});

// ============================================================================
// UI Helper Functions
// ============================================================================

/**
 * Checks if avers is valid (not empty after trim and within limit)
 * Used by UI components for real-time validation feedback
 */
export function isAversValid(value: string): boolean {
  return value.trim().length > 0 && value.length <= AVERS_MAX_LENGTH;
}

/**
 * Checks if rewers is valid (not empty after trim and within limit)
 * Used by UI components for real-time validation feedback
 */
export function isRewersValid(value: string): boolean {
  return value.trim().length > 0 && value.length <= REWERS_MAX_LENGTH;
}

/**
 * Gets the validation error message for avers field
 */
export function getAversErrorMessage(value: string): string | null {
  if (value.trim().length === 0) {
    return "Awers nie może być pusty";
  }
  if (value.length > AVERS_MAX_LENGTH) {
    return `Przekroczono limit ${AVERS_MAX_LENGTH} znaków`;
  }
  return null;
}

/**
 * Gets the validation error message for rewers field
 */
export function getRewersErrorMessage(value: string): string | null {
  if (value.trim().length === 0) {
    return "Rewers nie może być pusty";
  }
  if (value.length > REWERS_MAX_LENGTH) {
    return `Przekroczono limit ${REWERS_MAX_LENGTH} znaków`;
  }
  return null;
}
