/**
 * API Endpoint: Generate Flashcard Proposals
 *
 * POST /api/flashcards/generate
 *
 * Generates flashcard proposals from user-provided text using AI.
 * The proposals are returned in real-time and not persisted to the database.
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  GenerateFlashcardsRequestDTO,
  GenerateFlashcardsResponseDTO,
  ErrorResponseDTO,
} from "../../../types";
import { generateFlashcards, AIServiceUnavailableError } from "../../../lib/ai/generation.service";
import { logGenerationError, createErrorLogData } from "../../../lib/logging/error.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

// Disable pre-rendering for this API route
export const prerender = false;

// Zod schema for request validation
const GenerateFlashcardsRequestSchema = z.object({
  text: z
    .string()
    .min(1, "Text cannot be empty")
    .max(10000, "Text cannot exceed 10,000 characters"),
  model: z.string().optional(),
});

/**
 * POST handler for flashcard generation
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();

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
      },
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
      },
    );
  }

  // Validate request body with Zod
  const validation = GenerateFlashcardsRequestSchema.safeParse(requestBody);
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
      },
    );
  }

  const validatedData: GenerateFlashcardsRequestDTO = validation.data;
  const { text, model } = validatedData;

  // Determine which model to use (use provided model or let service use default)
  const modelToUse = model || "openai/gpt-4o"; // Fallback to default if not provided

  try {
    // Call AI generation service
    const flashcardProposals = await generateFlashcards(text, modelToUse);

    // Calculate generation duration
    const generationDuration = Date.now() - startTime;

    // Build success response
    const response: GenerateFlashcardsResponseDTO = {
      flashcard_proposals: flashcardProposals,
      generation_duration: generationDuration,
      model: modelToUse,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Calculate error duration for logging
    const errorDuration = Date.now() - startTime;

    // Prepare input payload for error logging
    const inputPayload = {
      text: text.substring(0, 500), // Store only first 500 chars to avoid bloat
      model: modelToUse,
      text_length: text.length,
    };

    // Log error to database (best effort - don't fail the request if logging fails)
    try {
      if (error instanceof Error) {
        const errorLogData = createErrorLogData(error, modelToUse, inputPayload);
        await logGenerationError(supabase, userId, errorLogData);
      }
    } catch (loggingError) {
      // Log to console but don't fail the request
      console.error("Failed to log error to database:", loggingError);
    }

    // Handle AI service unavailable errors (503)
    if (error instanceof AIServiceUnavailableError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "AI service is temporarily unavailable. Please try again later.",
            details: {
              model: modelToUse,
              duration: errorDuration,
            },
          },
        } satisfies ErrorResponseDTO),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Handle all other errors (500)
    return new Response(
      JSON.stringify({
        error: {
          code: "GENERATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to generate flashcards",
          details: {
            model: modelToUse,
            duration: errorDuration,
          },
        },
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

