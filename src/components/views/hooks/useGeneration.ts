/**
 * useGeneration Hook
 *
 * Custom hook for managing the flashcard generation flow.
 *
 * Handles state management for:
 * - User input text
 * - Generation state machine (idle → generating → reviewing → saving → success)
 * - Flashcard proposals (review and edit)
 * - API calls to generate and save flashcards
 * - Error handling
 *
 * Refactored to use:
 * - Extracted useFlashcardProposals hook for proposal management
 * - Centralized API service for HTTP requests
 * - Centralized validation schemas
 */

import { useState, useCallback } from "react";
import type { GenerationViewState, ApiError, CreateFlashcardSetResponseDTO } from "@/types";
import { useFlashcardProposals } from "./useFlashcardProposals";
import {
  generateFlashcards,
  createFlashcardSet,
  FlashcardGenerationApiError,
} from "@/lib/api/flashcard-generation.api";
import { validateGenerationText, validateSetName } from "@/lib/validation/generation.validation";
import { DEFAULT_MODEL_ID } from "@/lib/llm-models.config";

// ============================================================================
// Types
// ============================================================================

interface GenerationMetadata {
  model: string;
  generation_duration: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a standardized API error object from various error types
 */
function createApiError(title: string, error: unknown): ApiError {
  if (error instanceof FlashcardGenerationApiError) {
    return { title, message: error.message };
  }
  return {
    title,
    message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
  };
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing the flashcard generation flow
 */
export function useGeneration() {
  // ============================================================================
  // Core State
  // ============================================================================

  const [state, setState] = useState<GenerationViewState>("idle");
  const [text, setText] = useState("");
  const [setName, setSetName] = useState("");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [error, setError] = useState<ApiError | null>(null);
  const [savedSetInfo, setSavedSetInfo] = useState<CreateFlashcardSetResponseDTO | null>(null);
  const [generationMetadata, setGenerationMetadata] = useState<GenerationMetadata | null>(null);

  // ============================================================================
  // Proposal Management (Extracted Hook)
  // ============================================================================

  const { proposals, setProposalsFromApi, updateProposal, deleteProposal, toggleFlag, clearProposals } =
    useFlashcardProposals();

  // ============================================================================
  // API Functions
  // ============================================================================

  /**
   * Generates flashcard proposals from input text using AI
   */
  const generateProposals = useCallback(async () => {
    // Validate input using centralized schema
    const validation = validateGenerationText(text);
    if (!validation.success) {
      setError({
        title: "Nieprawidłowe dane wejściowe",
        message: "Tekst nie może być pusty i nie może przekraczać 10 000 znaków.",
      });
      setState("error");
      return;
    }

    try {
      setState("generating");
      setError(null);

      // Call API service with selected model
      const data = await generateFlashcards({ text: validation.data, model: selectedModel });

      // Transform and store proposals
      setProposalsFromApi(data.flashcard_proposals);
      setGenerationMetadata({
        model: data.model,
        generation_duration: data.generation_duration,
      });
      setState("reviewing");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error generating flashcards:", err);
      setError(createApiError("Błąd generowania", err));
      setState("error");
    }
  }, [text, selectedModel, setProposalsFromApi]);

  /**
   * Saves the flashcard set with all proposals
   */
  const saveFlashcardSet = useCallback(async () => {
    // Validate set name using centralized schema
    const nameValidation = validateSetName(setName);
    if (!nameValidation.success) {
      setError({
        title: "Nieprawidłowa nazwa zestawu",
        message: "Nazwa zestawu nie może być pusta i nie może przekraczać 100 znaków.",
      });
      setState("error");
      return;
    }

    // Validate we have proposals
    if (proposals.length === 0) {
      setError({
        title: "Brak fiszek",
        message: "Musisz mieć co najmniej jedną fiszkę do zapisania.",
      });
      setState("error");
      return;
    }

    try {
      setState("saving");
      setError(null);

      // Call API service
      const data = await createFlashcardSet({
        name: nameValidation.data,
        model: generationMetadata?.model || "unknown",
        generation_duration: generationMetadata?.generation_duration || 0,
        flashcards: proposals.map((proposal) => ({
          avers: proposal.avers,
          rewers: proposal.rewers,
          source: proposal.source,
          flagged: proposal.isFlagged,
        })),
      });

      setSavedSetInfo(data);
      setState("success");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error saving flashcard set:", err);
      setError(createApiError("Błąd zapisywania", err));
      setState("error");
    }
  }, [setName, proposals, generationMetadata]);

  // ============================================================================
  // Reset Function
  // ============================================================================

  /**
   * Resets the hook to its initial state
   */
  const reset = useCallback(() => {
    setState("idle");
    setText("");
    setSetName("");
    setSelectedModel(DEFAULT_MODEL_ID);
    clearProposals();
    setError(null);
    setSavedSetInfo(null);
    setGenerationMetadata(null);
  }, [clearProposals]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    state,
    text,
    setName,
    selectedModel,
    proposals,
    error,
    savedSetInfo,

    // Text and name setters
    setText,
    setSetName,
    setSelectedModel,

    // API actions
    generateProposals,
    saveFlashcardSet,

    // Proposal manipulation
    updateProposal,
    deleteProposal,
    toggleFlag,

    // Utility
    reset,
  };
}
