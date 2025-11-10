/**
 * Custom Error Classes for OpenRouter Service
 *
 * These error classes provide specific error handling for different
 * failure scenarios in the OpenRouter API integration.
 */

/**
 * Error thrown when service configuration is invalid or missing
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Error thrown when data validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when OpenRouter API communication fails
 */
export class ApiError extends Error {
  public status: number;
  public details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
