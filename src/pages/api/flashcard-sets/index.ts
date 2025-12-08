/**
 * API Endpoint: Flashcard Sets Management
 *
 * GET /api/flashcard-sets - List flashcard sets (paginated)
 * POST /api/flashcard-sets - Create a new flashcard set
 *
 * Creates a new flashcard set with optional flashcards.
 * The operation is transactional - either all data is created or none.
 */

import type { APIRoute } from "astro";
import type {
  CreateFlashcardSetRequestDTO,
  CreateFlashcardSetResponseDTO,
  ErrorResponseDTO,
  FlashcardSetCreateCommand,
} from "../../../types";
import {
  createFlashcardSet,
  listFlashcardSets,
  FlashcardSetNameConflictError,
  FlashcardSetTransactionError,
  FlashcardSetOperationError,
} from "../../../lib/flashcard-set.service";
import { FlashcardSetQuerySchema, CreateFlashcardSetSchema } from "../../../lib/validation/flashcard-sets";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

// Disable pre-rendering for this API route
export const prerender = false;

/**
 * GET handler for listing flashcard sets
 * Supports pagination via query params: limit, offset, sort
 */
export const GET: APIRoute = async ({ request, locals, cookies }) => {
  // Authentication check
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Parse query parameters
  const url = new URL(request.url);
  const queryParams = {
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  };

  // Validate query parameters
  const validation = FlashcardSetQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    const errors = validation.error.flatten();
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: errors.fieldErrors,
        },
      } satisfies ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  try {
    // Call service to list flashcard sets
    const result = await listFlashcardSets(user.id, validation.data, supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle operation errors
    if (error instanceof FlashcardSetOperationError) {
      // eslint-disable-next-line no-console
      console.error("Flashcard set operation error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "OPERATION_FAILED",
            message: "Failed to retrieve flashcard sets",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle all other unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error listing flashcard sets:", error);
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

/**
 * POST handler for creating flashcard sets
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  // Get user from locals (set by middleware after authentication)
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const userId = user.id;

  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Parse request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
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
  const validation = CreateFlashcardSetSchema.safeParse(requestBody);
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
      // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
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
