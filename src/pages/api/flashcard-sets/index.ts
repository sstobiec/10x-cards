/**
 * API Endpoint: Flashcard Sets Management
 *
 * POST /api/flashcard-sets
 *
 * Creates a new flashcard set with optional flashcards.
 * The operation is transactional - either all data is created or none.
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  CreateFlashcardSetRequestDTO,
  CreateFlashcardSetResponseDTO,
  ErrorResponseDTO,
  FlashcardSetCreateCommand,
} from "../../../types";
import {
  createFlashcardSet,
  FlashcardSetNameConflictError,
  FlashcardSetTransactionError,
} from "../../../lib/flashcard-set.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

// Disable pre-rendering for this API route
export const prerender = false;

// Zod schema for flashcard validation
const FlashcardCreateCommandSchema = z.object({
  avers: z.string().min(1, "Front of flashcard cannot be empty").max(200, "Front cannot exceed 200 characters"),
  rewers: z.string().min(1, "Back of flashcard cannot be empty").max(750, "Back cannot exceed 750 characters"),
  source: z.enum(["manual", "ai-full", "ai-edited"], {
    errorMap: () => ({ message: "Source must be one of: manual, ai-full, ai-edited" }),
  }),
});

// Zod schema for request validation
const CreateFlashcardSetRequestSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100, "Name cannot exceed 100 characters"),
  model: z.string().min(1, "Model cannot be empty").max(100, "Model cannot exceed 100 characters"),
  generation_duration: z.number().int().min(0, "Generation duration must be a non-negative integer"),
  flashcards: z.array(FlashcardCreateCommandSchema).optional(),
});

/**
 * POST handler for creating flashcard sets
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Get Supabase client from locals (provided by middleware)
  const supabase = locals.supabase;
  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Database client not available",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // TODO: Once authentication is implemented, get user ID from session
  // For now, using DEFAULT_USER_ID from supabase.client.ts
  const userId = DEFAULT_USER_ID;

  // Parse request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate request body with Zod
  const validation = CreateFlashcardSetRequestSchema.safeParse(requestBody);
  if (!validation.success) {
    const errors = validation.error.flatten();
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: errors.fieldErrors,
        },
      } satisfies ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const validatedData: CreateFlashcardSetRequestDTO = validation.data;

  // Build command object for service
  const command: FlashcardSetCreateCommand = {
    name: validatedData.name,
    model: validatedData.model,
    generation_duration: validatedData.generation_duration,
    flashcards: validatedData.flashcards || [],
  };

  try {
    // Call service to create flashcard set
    const createdSet: CreateFlashcardSetResponseDTO = await createFlashcardSet(command, userId, supabase);

    // Return success response with 201 Created
    return new Response(JSON.stringify(createdSet), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle name conflict error (409 Conflict)
    if (error instanceof FlashcardSetNameConflictError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NAME_CONFLICT",
            message: error.message,
            details: {
              field: "name",
              value: validatedData.name,
            },
          },
        } satisfies ErrorResponseDTO),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle transaction errors (500 Internal Server Error)
    if (error instanceof FlashcardSetTransactionError) {
      console.error("Flashcard set transaction error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "TRANSACTION_FAILED",
            message: "Failed to create flashcard set due to a database error",
            details: {
              originalMessage: error.message,
            },
          },
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle all other unexpected errors (500)
    console.error("Unexpected error creating flashcard set:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "An unexpected error occurred",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
