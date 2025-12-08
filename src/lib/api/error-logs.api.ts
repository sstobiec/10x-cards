/**
 * Error Logs API Service
 *
 * Client-side API service for logging application errors.
 * Handles HTTP requests to the error logging endpoint.
 */

import type { CreateErrorLogRequestDTO, CreateErrorLogResponseDTO } from "@/types";

/**
 * Custom error class for error logging API errors
 * Provides structured error information including HTTP status and error code
 */
export class ErrorLogApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ErrorLogApiError";
  }
}

/**
 * Logs an error to the server via the API
 *
 * @param data - The error log data
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to the created error log
 * @throws {ErrorLogApiError} When the API request fails
 */
export async function logError(
  data: CreateErrorLogRequestDTO,
  signal?: AbortSignal
): Promise<CreateErrorLogResponseDTO> {
  const response = await fetch("/api/error-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ErrorLogApiError(
      errorData.error?.message || "Failed to log error",
      response.status,
      errorData.error?.code
    );
  }

  return response.json();
}

