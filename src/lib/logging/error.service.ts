/**
 * Error Logging Service
 *
 * This service handles logging of errors to the database
 * for monitoring and debugging purposes.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateErrorLogRequestDTO } from "../../types";

/**
 * Error thrown when error logging fails
 */
export class ErrorLoggingError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "ErrorLoggingError";
  }
}

/**
 * Logs a generation error to the database
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user who experienced the error
 * @param errorData - Error details to log
 * @returns Promise resolving to the created error log ID
 * @throws {ErrorLoggingError} When logging fails
 */
export async function logGenerationError(
  supabase: SupabaseClient,
  userId: string,
  errorData: CreateErrorLogRequestDTO
): Promise<string> {
  // Validate required fields
  if (!userId || !errorData.model || !errorData.error_type || !errorData.error_message) {
    throw new ErrorLoggingError("Missing required fields for error logging");
  }

  try {
    // Insert error log into database
    const { data, error } = await supabase
      .from("error_logs")
      .insert({
        user_id: userId,
        model: errorData.model,
        error_type: errorData.error_type,
        error_message: errorData.error_message,
        input_payload: errorData.input_payload ?? null,
      })
      .select("id")
      .single();

    if (error) {
      throw new ErrorLoggingError(`Failed to insert error log: ${error.message}`, error);
    }

    if (!data?.id) {
      throw new ErrorLoggingError("Error log was inserted but no ID was returned");
    }

    return data.id;
  } catch (error) {
    // Re-throw our custom error
    if (error instanceof ErrorLoggingError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new ErrorLoggingError(
      `Unexpected error while logging to database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }
}

/**
 * Helper function to create error log data from an error object
 *
 * @param error - The error that occurred
 * @param model - The AI model that was being used
 * @param inputPayload - The input that caused the error
 * @returns CreateErrorLogRequestDTO object ready for logging
 */
export function createErrorLogData(
  error: Error,
  model: string,
  inputPayload?: Record<string, unknown>
): CreateErrorLogRequestDTO {
  return {
    model,
    error_type: error.name || "Error",
    error_message: error.message || "Unknown error occurred",
    input_payload: inputPayload as CreateErrorLogRequestDTO["input_payload"],
  };
}
