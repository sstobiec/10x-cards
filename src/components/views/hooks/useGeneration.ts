import { useState } from "react";
import type {
  GenerationViewState,
  FlashcardProposalViewModel,
  ApiError,
  GenerateFlashcardsRequestDTO,
  GenerateFlashcardsResponseDTO,
  CreateFlashcardSetRequestDTO,
  CreateFlashcardSetResponseDTO,
} from "@/types";

/**
 * Custom hook for managing the flashcard generation flow
 *
 * Handles state management for:
 * - User input text
 * - Generation state machine
 * - Flashcard proposals (review and edit)
 * - API calls to generate and save flashcards
 * - Error handling
 */
export function useGeneration() {
  // ============================================================================
  // State
  // ============================================================================

  const [state, setState] = useState<GenerationViewState>("idle");
  const [text, setText] = useState<string>("");
  const [setName, setSetName] = useState<string>("");
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [savedSetInfo, setSavedSetInfo] = useState<CreateFlashcardSetResponseDTO | null>(null);

  // Store generation metadata from API response
  const [generationMetadata, setGenerationMetadata] = useState<{
    model: string;
    generation_duration: number;
  } | null>(null);

  // ============================================================================
  // API Functions
  // ============================================================================

  /**
   * Generates flashcard proposals from input text using AI
   */
  const generateProposals = async () => {
    // Validate input
    if (!text.trim() || text.length > 10000) {
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

      const requestBody: GenerateFlashcardsRequestDTO = {
        text: text.trim(),
      };

      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się wygenerować fiszek");
      }

      const data: GenerateFlashcardsResponseDTO = await response.json();

      // Map API response to view models with unique IDs
      const viewModels: FlashcardProposalViewModel[] = data.flashcard_proposals.map((proposal) => ({
        id: crypto.randomUUID(),
        avers: proposal.avers,
        rewers: proposal.rewers,
        source: "ai-full" as const,
        isFlagged: false,
      }));

      // Store metadata for later use when saving
      setGenerationMetadata({
        model: data.model,
        generation_duration: data.generation_duration,
      });

      setProposals(viewModels);
      setState("reviewing");
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setError({
        title: "Błąd generowania",
        message: err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd podczas generowania fiszek.",
      });
      setState("error");
    }
  };

  /**
   * Saves the flashcard set with all proposals
   */
  const saveFlashcardSet = async () => {
    // Validate set name
    if (!setName.trim() || setName.length > 100) {
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

      const requestBody: CreateFlashcardSetRequestDTO = {
        name: setName.trim(),
        model: generationMetadata?.model || "unknown",
        generation_duration: generationMetadata?.generation_duration || 0,
        flashcards: proposals.map((proposal) => ({
          avers: proposal.avers,
          rewers: proposal.rewers,
          source: proposal.source,
          flagged: proposal.isFlagged,
        })),
      };

      const response = await fetch("/api/flashcard-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 409) {
          throw new Error("Zestaw o tej nazwie już istnieje.");
        }
        
        throw new Error(errorData.error?.message || "Nie udało się zapisać zestawu");
      }

      const data: CreateFlashcardSetResponseDTO = await response.json();

      setSavedSetInfo(data);
      setState("success");
    } catch (err) {
      console.error("Error saving flashcard set:", err);
      setError({
        title: "Błąd zapisywania",
        message: err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd podczas zapisywania zestawu.",
      });
      setState("error");
    }
  };

  // ============================================================================
  // Proposal Manipulation Functions
  // ============================================================================

  /**
   * Updates a proposal's content
   */
  const updateProposal = (id: string, avers: string, rewers: string) => {
    setProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.id === id) {
          return {
            ...proposal,
            avers,
            rewers,
            // Mark as edited if content changed
            source: "ai-edited" as const,
          };
        }
        return proposal;
      })
    );
  };

  /**
   * Deletes a proposal from the list
   */
  const deleteProposal = (id: string) => {
    setProposals((prev) => prev.filter((proposal) => proposal.id !== id));
  };

  /**
   * Toggles the flagged status of a proposal
   */
  const toggleFlag = (id: string) => {
    setProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.id === id) {
          return {
            ...proposal,
            isFlagged: !proposal.isFlagged,
          };
        }
        return proposal;
      })
    );
  };

  // ============================================================================
  // Reset Function
  // ============================================================================

  /**
   * Resets the hook to its initial state
   */
  const reset = () => {
    setState("idle");
    setText("");
    setSetName("");
    setProposals([]);
    setError(null);
    setSavedSetInfo(null);
    setGenerationMetadata(null);
  };

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    state,
    text,
    setName,
    proposals,
    error,
    savedSetInfo,

    // Text and name setters
    setText,
    setSetName,

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

