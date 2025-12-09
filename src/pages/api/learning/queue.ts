/**
 * API Endpoint: Learning Queue
 *
 * GET /api/learning/queue?setId=<uuid>&limit=<number>
 * Returns flashcards due for review in a learning session
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../types";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { GetLearningQueueQuerySchema } from "../../../lib/validation/learning.validation";
import {
  getDueFlashcards,
  LearningAccessDeniedError,
  LearningDatabaseError,
} from "../../../lib/services/learning.service";

// Disable pre-rendering for this API route
export const prerender = false;

/**
 * GET handler for retrieving flashcards due for learning
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
    setId: url.searchParams.get("setId"),
    limit: url.searchParams.get("limit"),
  };

  // Validate query parameters
  const validation = GetLearningQueueQuerySchema.safeParse(queryParams);
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

  const { setId, limit } = validation.data;

  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  try {
    // Call service to get due flashcards
    const result = await getDueFlashcards(user.id, setId, limit, supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle access denied error
    if (error instanceof LearningAccessDeniedError) {
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

    // Handle database errors
    if (error instanceof LearningDatabaseError) {
      // eslint-disable-next-line no-console
      console.error("Learning database error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "OPERATION_FAILED",
            message: "Failed to retrieve learning queue",
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
    console.error("Unexpected error fetching learning queue:", error);
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
