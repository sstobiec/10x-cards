/**
 * LLM Models Configuration
 *
 * Configuration for available AI models used in flashcard generation.
 * Models are provided through OpenRouter API.
 */

/**
 * Represents a single LLM model option
 */
export interface LLMModel {
  /** Unique model identifier used in API calls */
  id: string;
  /** Display name shown to users */
  name: string;
  /** Short description of the model */
  description: string;
  /** Provider name (e.g., OpenAI, Anthropic) */
  provider: string;
}

/**
 * Available LLM models for flashcard generation
 * Sorted by recommended order (best performance first)
 */
export const LLM_MODELS: LLMModel[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "Najnowszy model OpenAI - najlepsza jakość",
    provider: "OpenAI",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Szybszy i tańszy wariant GPT-4o",
    provider: "OpenAI",
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Najnowszy, wysoce wydajny model od Google",
    provider: "Google",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Zaawansowany model Anthropic",
    provider: "Anthropic",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "Szybki i ekonomiczny model Anthropic",
    provider: "Anthropic",
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5",
    description: "Model Google z dużym kontekstem",
    provider: "Google",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    description: "Otwarty model Meta - dobra jakość",
    provider: "Meta",
  },
];

/**
 * Default model ID used when no model is selected
 */
export const DEFAULT_MODEL_ID = "openai/gpt-4o";

/**
 * Gets model configuration by ID
 * @param modelId - Model identifier
 * @returns Model configuration or undefined if not found
 */
export function getModelById(modelId: string): LLMModel | undefined {
  return LLM_MODELS.find((model) => model.id === modelId);
}

/**
 * Gets the default model configuration
 * @returns Default model configuration
 */
export function getDefaultModel(): LLMModel {
  const model = getModelById(DEFAULT_MODEL_ID);
  if (!model) {
    throw new Error(`Default model ${DEFAULT_MODEL_ID} not found in configuration`);
  }
  return model;
}
