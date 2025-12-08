/**
 * Flashcard Sets Validation Schemas
 *
 * Centralized Zod validation schemas for flashcard set operations.
 * Used by API endpoints for request validation.
 */

import { z } from "zod";
import { FlashcardAversSchema, FlashcardRewersSchema, FlashcardSourceSchema } from "./flashcard.validation";

// ============================================================================
// Constants
// ============================================================================

export const SET_NAME_MAX_LENGTH = 100;
export const MODEL_MAX_LENGTH = 100;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

// ============================================================================
// Query Parameter Schemas
// ============================================================================

/**
 * Schema for validating list query parameters
 * GET /api/flashcard-sets?limit=50&offset=0&sort=created_at_desc
 */
export const FlashcardSetQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(MAX_LIMIT, `Limit cannot exceed ${MAX_LIMIT}`)
    .default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0, "Offset must be non-negative").default(0),
  sort: z
    .enum(["created_at_desc", "created_at_asc"], {
      errorMap: () => ({ message: "Sort must be 'created_at_desc' or 'created_at_asc'" }),
    })
    .default("created_at_desc"),
});

export type FlashcardSetQueryParams = z.infer<typeof FlashcardSetQuerySchema>;

// ============================================================================
// Request Body Schemas
// ============================================================================

/**
 * Schema for creating a flashcard within a set
 */
export const FlashcardCreateCommandSchema = z.object({
  avers: FlashcardAversSchema,
  rewers: FlashcardRewersSchema,
  source: FlashcardSourceSchema,
  flagged: z.boolean().default(false),
});

/**
 * Schema for creating a new flashcard set
 * POST /api/flashcard-sets
 */
export const CreateFlashcardSetSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(SET_NAME_MAX_LENGTH, `Name cannot exceed ${SET_NAME_MAX_LENGTH} characters`)
    .transform((val) => val.trim()),
  model: z
    .string()
    .min(1, "Model cannot be empty")
    .max(MODEL_MAX_LENGTH, `Model cannot exceed ${MODEL_MAX_LENGTH} characters`),
  generation_duration: z.number().int().min(0, "Generation duration must be a non-negative integer"),
  flashcards: z.array(FlashcardCreateCommandSchema).optional(),
});

export type CreateFlashcardSetInput = z.infer<typeof CreateFlashcardSetSchema>;

/**
 * Schema for updating a flashcard set
 * PATCH /api/flashcard-sets/:id
 */
export const UpdateFlashcardSetSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(SET_NAME_MAX_LENGTH, `Name cannot exceed ${SET_NAME_MAX_LENGTH} characters`)
    .transform((val) => val.trim()),
});

export type UpdateFlashcardSetInput = z.infer<typeof UpdateFlashcardSetSchema>;

// ============================================================================
// URL Parameter Schemas
// ============================================================================

/**
 * Schema for validating UUID parameters
 */
export const UUIDParamSchema = z.string().uuid("Invalid UUID format");
