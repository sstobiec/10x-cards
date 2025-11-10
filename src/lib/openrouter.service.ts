/**
 * OpenRouter Service
 *
 * This service handles communication with OpenRouter API to generate
 * structured responses from language models using Zod schema validation.
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ApiError, ConfigurationError, ValidationError } from './ai/errors';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Parameters for generating a structured response
 */
interface GenerationParams<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.Schema<T>;
  modelName?: string;
  modelParams?: Record<string, unknown>;
}

/**
 * OpenRouter API request body structure
 */
interface OpenRouterRequestBody {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  response_format: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: object;
    };
  };
  [key: string]: unknown; // Allows additional model parameters
}

// ============================================================================
// OpenRouter Service Class
// ============================================================================

/**
 * Service for interacting with OpenRouter API to generate structured responses
 */
export class OpenRouterService {
  #apiKey: string;
  #baseUrl = 'https://openrouter.ai/api/v1';

  /**
   * Initializes the OpenRouter service
   * @throws {ConfigurationError} If OPENROUTER_API_KEY is not configured
   */
  constructor() {
    this.#apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!this.#apiKey) {
      throw new ConfigurationError('Brak klucza OPENROUTER_API_KEY w zmiennych środowiskowych.');
    }
  }

  /**
   * Generates a structured response from the language model
   *
   * @param params - Generation parameters including prompts, schema, and model settings
   * @returns Promise resolving to validated response matching the provided schema
   * @throws {ValidationError} If input is invalid or response doesn't match schema
   * @throws {ApiError} If API communication fails
   */
  public async generateStructuredResponse<T>({
    systemPrompt,
    userPrompt,
    schema,
    modelName = 'openai/gpt-4o',
    modelParams = {},
  }: GenerationParams<T>): Promise<T> {
    // Validate input
    if (!userPrompt) {
      throw new ValidationError('Pusty userPrompt jest niedozwolony.');
    }

    // Build request body
    const requestBody = this.#buildRequestBody(systemPrompt, userPrompt, schema, modelName, modelParams);

    // Send request to OpenRouter API
    const response = await this.#sendRequest(requestBody);

    // Parse and validate response
    return this.#parseAndValidateResponse(response, schema);
  }

  /**
   * Builds the request body for OpenRouter API
   *
   * @param systemPrompt - System instruction for the model
   * @param userPrompt - User query
   * @param schema - Zod schema defining expected response structure
   * @param modelName - Name of the model to use
   * @param modelParams - Additional model parameters
   * @returns Formatted request body for OpenRouter API
   */
  #buildRequestBody<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.Schema<T>,
    modelName: string,
    modelParams: Record<string, unknown>
  ): OpenRouterRequestBody {
    const schemaName = 'StructuredResponse';
    const jsonSchema = zodToJsonSchema(schema, schemaName);

    return {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          strict: true,
          schema: jsonSchema.definitions?.[schemaName] ?? {},
        },
      },
      ...modelParams,
    };
  }

  /**
   * Sends HTTP request to OpenRouter API
   *
   * @param body - Request body to send
   * @returns Response from the API
   * @throws {ApiError} If request fails or returns non-OK status
   */
  async #sendRequest(body: OpenRouterRequestBody): Promise<Response> {
    try {
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.#apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(`Błąd API OpenRouter: ${response.statusText}`, response.status, errorData);
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Błąd sieci podczas komunikacji z OpenRouter.', 500, error);
    }
  }

  /**
   * Parses and validates API response against provided schema
   *
   * @param response - HTTP response from OpenRouter API
   * @param schema - Zod schema to validate against
   * @returns Parsed and validated response data
   * @throws {ValidationError} If response is invalid or doesn't match schema
   */
  async #parseAndValidateResponse<T>(response: Response, schema: z.Schema<T>): Promise<T> {
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      throw new ValidationError('Odpowiedź API nie jest prawidłowym formatem JSON.');
    }

    const content = responseData?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new ValidationError('Brak zawartości w odpowiedzi API.');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      throw new ValidationError('Zawartość odpowiedzi nie jest prawidłowym obiektem JSON.');
    }

    const validationResult = schema.safeParse(parsedContent);
    if (!validationResult.success) {
      throw new ValidationError(`Odpowiedź API nie przeszła walidacji schematu: ${validationResult.error.message}`);
    }

    return validationResult.data;
  }
}

