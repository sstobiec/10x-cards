/**
 * useFlashcardProposals Hook
 *
 * Manages flashcard proposal state and operations.
 * Extracted from useGeneration for better separation of concerns.
 */

import { useState, useCallback } from "react";
import type { FlashcardProposalViewModel, FlashcardProposalDTO } from "@/types";

/**
 * Custom hook for managing flashcard proposals
 *
 * Handles:
 * - Transforming API proposals to view models
 * - Updating proposal content
 * - Deleting proposals
 * - Toggling flag status
 * - Clearing all proposals
 */
export function useFlashcardProposals() {
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);

  /**
   * Transforms API proposals to view models with unique IDs
   */
  const setProposalsFromApi = useCallback((apiProposals: FlashcardProposalDTO[]) => {
    const viewModels: FlashcardProposalViewModel[] = apiProposals.map((proposal) => ({
      id: crypto.randomUUID(),
      avers: proposal.avers,
      rewers: proposal.rewers,
      source: "ai-full" as const,
      isFlagged: false,
    }));
    setProposals(viewModels);
  }, []);

  /**
   * Updates a proposal's content and marks it as edited
   */
  const updateProposal = useCallback((id: string, avers: string, rewers: string) => {
    setProposals((prev) =>
      prev.map((proposal) =>
        proposal.id === id ? { ...proposal, avers, rewers, source: "ai-edited" as const } : proposal
      )
    );
  }, []);

  /**
   * Removes a proposal from the list
   */
  const deleteProposal = useCallback((id: string) => {
    setProposals((prev) => prev.filter((proposal) => proposal.id !== id));
  }, []);

  /**
   * Toggles the flagged status of a proposal
   */
  const toggleFlag = useCallback((id: string) => {
    setProposals((prev) =>
      prev.map((proposal) => (proposal.id === id ? { ...proposal, isFlagged: !proposal.isFlagged } : proposal))
    );
  }, []);

  /**
   * Clears all proposals
   */
  const clearProposals = useCallback(() => {
    setProposals([]);
  }, []);

  return {
    proposals,
    setProposalsFromApi,
    updateProposal,
    deleteProposal,
    toggleFlag,
    clearProposals,
  };
}
