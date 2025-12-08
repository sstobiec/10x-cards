/**
 * API Endpoint: Error Logs
 *
 * POST /api/error-logs - Create a new error log entry
 *
 * Allows authenticated users to log errors (particularly AI generation failures)
 * for monitoring and debugging purposes.
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import type { ErrorResponseDTO } from "../../types";
import { createErrorLog, ErrorLoggingError } from "../../lib/logging/error.service";
import { createSupabaseServerInstance } from "../../db/supabase.client";

export const prerender = false;

// Zod schema for input validation
const CreateErrorLogSchema = z.object({
  model: z.string().min(1, "Model is required").max(100, "Model must be 100 characters or less"),
  error_type: z.string().min(1, "Error type is required").max(100, "Error type must be 100 characters or less"),
  error_message: z.string().min(1, "Error message is required"),
  input_payload: z.record(z.unknown()).optional(),
});

/**
 * POST handler for creating error log entries
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

  // Validate request body with Zod
  const validation = CreateErrorLogSchema.safeParse(requestBody);
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

  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  try {
    const newLog = await createErrorLog(supabase, user.id, validation.data);

    return new Response(JSON.stringify(newLog), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ErrorLoggingError) {
      // eslint-disable-next-line no-console
      console.error("Error logging failed:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "LOGGING_FAILED",
            message: "Failed to create error log entry",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/error-logs:", error);
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
