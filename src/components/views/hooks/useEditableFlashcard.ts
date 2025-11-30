/**
 * useEditableFlashcard Hook
 *
 * Manages edit state and validation for a single flashcard proposal.
 * Extracts edit-mode logic from FlashcardProposalItem for better separation of concerns.
 */

import { useState, useCallback } from "react";
import {
  isAversValid,
  isRewersValid,
  getAversErrorMessage,
  getRewersErrorMessage,
  AVERS_MAX_LENGTH,
  REWERS_MAX_LENGTH,
} from "@/lib/validation/flashcard.validation";
import type { FlashcardProposalViewModel } from "@/types";

interface UseEditableFlashcardReturn {
  // State
  isEditing: boolean;
  editedAvers: string;
  editedRewers: string;

  // Validation
  isAversFieldValid: boolean;
  isRewersFieldValid: boolean;
  isFormValid: boolean;
  aversErrorMessage: string | null;
  rewersErrorMessage: string | null;

  // Constants (for UI display)
  aversMaxLength: number;
  rewersMaxLength: number;

  // Actions
  setEditedAvers: (value: string) => void;
  setEditedRewers: (value: string) => void;
  startEditing: () => void;
  cancelEditing: () => void;
  saveEditing: (onSave: (avers: string, rewers: string) => void) => void;
}

/**
 * Custom hook for managing flashcard edit state
 *
 * @param proposal - The flashcard proposal being edited
 * @returns Edit state, validation info, and action handlers
 */
export function useEditableFlashcard(proposal: FlashcardProposalViewModel): UseEditableFlashcardReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAvers, setEditedAvers] = useState(proposal.avers);
  const [editedRewers, setEditedRewers] = useState(proposal.rewers);

  // Validation
  const isAversFieldValid = isAversValid(editedAvers);
  const isRewersFieldValid = isRewersValid(editedRewers);
  const isFormValid = isAversFieldValid && isRewersFieldValid;

  // Error messages
  const aversErrorMessage = getAversErrorMessage(editedAvers);
  const rewersErrorMessage = getRewersErrorMessage(editedRewers);

  /**
   * Enter edit mode
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  /**
   * Cancel editing and reset to original values
   */
  const cancelEditing = useCallback(() => {
    setEditedAvers(proposal.avers);
    setEditedRewers(proposal.rewers);
    setIsEditing(false);
  }, [proposal.avers, proposal.rewers]);

  /**
   * Save changes if valid and exit edit mode
   */
  const saveEditing = useCallback(
    (onSave: (avers: string, rewers: string) => void) => {
      if (isFormValid) {
        onSave(editedAvers.trim(), editedRewers.trim());
        setIsEditing(false);
      }
    },
    [editedAvers, editedRewers, isFormValid]
  );

  return {
    // State
    isEditing,
    editedAvers,
    editedRewers,

    // Validation
    isAversFieldValid,
    isRewersFieldValid,
    isFormValid,
    aversErrorMessage,
    rewersErrorMessage,

    // Constants
    aversMaxLength: AVERS_MAX_LENGTH,
    rewersMaxLength: REWERS_MAX_LENGTH,

    // Actions
    setEditedAvers,
    setEditedRewers,
    startEditing,
    cancelEditing,
    saveEditing,
  };
}
