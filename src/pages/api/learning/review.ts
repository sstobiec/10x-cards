/**
 * API Endpoint: Submit Review
 *
 * POST /api/learning/review
 * Processes a user's review of a flashcard and updates learning progress
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../types";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { SubmitReviewBodySchema } from "../../../lib/validation/learning.validation";
import {
  processReview,
  FlashcardNotFoundError,
  LearningAccessDeniedError,
  LearningDatabaseError,
  AlgorithmError,
} from "../../../lib/services/learning.service";

// Disable pre-rendering for this API route
export const prerender = false;

/**
 * POST handler for submitting a flashcard review
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
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
  const validation = SubmitReviewBodySchema.safeParse(requestBody);
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

  const { flashcardId, rating } = validation.data;

  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  try {
    // Call service to process the review
    const result = await processReview(user.id, flashcardId, rating, supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle flashcard not found error
    if (error instanceof FlashcardNotFoundError) {
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
            message: "Failed to process review",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle algorithm errors
    if (error instanceof AlgorithmError) {
      // eslint-disable-next-line no-console
      console.error("FSRS algorithm error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "ALGORITHM_ERROR",
            message: "Failed to calculate next review schedule",
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
    console.error("Unexpected error processing review:", error);
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
