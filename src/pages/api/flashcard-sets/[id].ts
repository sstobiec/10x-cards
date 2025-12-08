/**
 * API Endpoint: Single Flashcard Set Operations
 *
 * GET /api/flashcard-sets/:id - Get flashcard set details with all flashcards
 * PATCH /api/flashcard-sets/:id - Update flashcard set name
 * DELETE /api/flashcard-sets/:id - Delete flashcard set and all its flashcards
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../types";
import {
  getFlashcardSetById,
  updateFlashcardSet,
  deleteFlashcardSet,
  FlashcardSetNotFoundError,
  FlashcardSetAccessDeniedError,
  FlashcardSetNameConflictError,
  FlashcardSetOperationError,
} from "../../../lib/flashcard-set.service";
import { UUIDParamSchema, UpdateFlashcardSetSchema } from "../../../lib/validation/flashcard-sets";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

// Disable pre-rendering for this API route
export const prerender = false;

/**
 * GET handler for retrieving a single flashcard set with all flashcards
 */
export const GET: APIRoute = async ({ params, request, locals, cookies }) => {
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

  // Validate ID parameter
  const idValidation = UUIDParamSchema.safeParse(params.id);
  if (!idValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_ID",
          message: "Invalid flashcard set ID format",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const setId = idValidation.data;

  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  try {
    // Call service to get flashcard set
    const result = await getFlashcardSetById(setId, user.id, supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle not found error
    if (error instanceof FlashcardSetNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        } satisfies ErrorResponseDTO),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle access denied error
    if (error instanceof FlashcardSetAccessDeniedError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        } satisfies ErrorResponseDTO),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle operation errors
    if (error instanceof FlashcardSetOperationError) {
      // eslint-disable-next-line no-console
      console.error("Flashcard set operation error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "OPERATION_FAILED",
            message: "Failed to retrieve flashcard set",
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
    console.error("Unexpected error fetching flashcard set:", error);
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
 * PATCH handler for updating a flashcard set name
 */
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
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

  // Validate ID parameter
  const idValidation = UUIDParamSchema.safeParse(params.id);
  if (!idValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_ID",
          message: "Invalid flashcard set ID format",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const setId = idValidation.data;

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

  // Validate request body
  const bodyValidation = UpdateFlashcardSetSchema.safeParse(requestBody);
  if (!bodyValidation.success) {
    const errors = bodyValidation.error.flatten();
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

  const { name } = bodyValidation.data;

  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  try {
    // Call service to update flashcard set
    const result = await updateFlashcardSet(setId, user.id, name, supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle not found error
    if (error instanceof FlashcardSetNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        } satisfies ErrorResponseDTO),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle access denied error
    if (error instanceof FlashcardSetAccessDeniedError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        } satisfies ErrorResponseDTO),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle name conflict error
    if (error instanceof FlashcardSetNameConflictError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NAME_CONFLICT",
            message: error.message,
            details: {
              field: "name",
              value: name,
            },
          },
        } satisfies ErrorResponseDTO),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle operation errors
    if (error instanceof FlashcardSetOperationError) {
      // eslint-disable-next-line no-console
      console.error("Flashcard set operation error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "OPERATION_FAILED",
            message: "Failed to update flashcard set",
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
    console.error("Unexpected error updating flashcard set:", error);
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
 * DELETE handler for removing a flashcard set and all its flashcards
 */
export const DELETE: APIRoute = async ({ params, request, locals, cookies }) => {
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

  // Validate ID parameter
  const idValidation = UUIDParamSchema.safeParse(params.id);
  if (!idValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_ID",
          message: "Invalid flashcard set ID format",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const setId = idValidation.data;

  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  try {
    // Call service to delete flashcard set
    await deleteFlashcardSet(setId, user.id, supabase);

    // Return 204 No Content on successful deletion
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle not found error
    if (error instanceof FlashcardSetNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        } satisfies ErrorResponseDTO),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle access denied error
    if (error instanceof FlashcardSetAccessDeniedError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        } satisfies ErrorResponseDTO),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle operation errors
    if (error instanceof FlashcardSetOperationError) {
      // eslint-disable-next-line no-console
      console.error("Flashcard set operation error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "OPERATION_FAILED",
            message: "Failed to delete flashcard set",
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
    console.error("Unexpected error deleting flashcard set:", error);
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
