import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  FlashcardSetDetailDTO,
  FlashcardDTO,
  CreateFlashcardRequestDTO,
  UpdateFlashcardRequestDTO,
  ErrorResponseDTO,
} from "@/types";

interface UseSetEditorReturn {
  set: FlashcardSetDetailDTO;
  isUpdatingName: boolean;
  isAddingFlashcard: boolean;
  updateSetName: (name: string) => Promise<void>;
  addFlashcard: (data: CreateFlashcardRequestDTO) => Promise<void>;
  updateFlashcard: (cardId: string, data: UpdateFlashcardRequestDTO) => Promise<void>;
  deleteFlashcard: (cardId: string) => Promise<void>;
}

export function useSetEditor(initialData: FlashcardSetDetailDTO): UseSetEditorReturn {
  const [set, setSet] = useState<FlashcardSetDetailDTO>(initialData);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isAddingFlashcard, setIsAddingFlashcard] = useState(false);

  /**
   * Updates the flashcard set name
   * PATCH /api/flashcard-sets/:id
   */
  const updateSetName = useCallback(
    async (name: string) => {
      setIsUpdatingName(true);

      try {
        const response = await fetch(`/api/flashcard-sets/${set.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponseDTO;

          if (response.status === 409) {
            throw new Error("Zestaw o tej nazwie już istnieje");
          }

          throw new Error(errorData.error?.message || "Nie udało się zmienić nazwy zestawu");
        }

        // Update local state
        setSet((prev) => ({
          ...prev,
          name,
          updated_at: new Date().toISOString(),
        }));

        toast.success("Zmieniono nazwę zestawu");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Wystąpił błąd podczas zmiany nazwy";
        toast.error(message);
        throw err;
      } finally {
        setIsUpdatingName(false);
      }
    },
    [set.id]
  );

  /**
   * Adds a new flashcard to the set
   * POST /api/flashcard-sets/:setId/flashcards
   */
  const addFlashcard = useCallback(
    async (data: CreateFlashcardRequestDTO) => {
      setIsAddingFlashcard(true);

      try {
        const response = await fetch(`/api/flashcard-sets/${set.id}/flashcards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponseDTO;
          throw new Error(errorData.error?.message || "Nie udało się dodać fiszki");
        }

        const newFlashcard = (await response.json()) as FlashcardDTO;

        // Add new flashcard at the beginning of the list
        setSet((prev) => ({
          ...prev,
          flashcards: [newFlashcard, ...prev.flashcards],
          updated_at: new Date().toISOString(),
        }));

        toast.success("Dodano fiszkę");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Wystąpił błąd podczas dodawania fiszki";
        toast.error(message);
        throw err;
      } finally {
        setIsAddingFlashcard(false);
      }
    },
    [set.id]
  );

  /**
   * Updates an existing flashcard
   * PATCH /api/flashcards/:id
   */
  const updateFlashcard = useCallback(async (cardId: string, data: UpdateFlashcardRequestDTO) => {
    try {
      const response = await fetch(`/api/flashcards/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDTO;
        throw new Error(errorData.error?.message || "Nie udało się zaktualizować fiszki");
      }

      const updatedFlashcard = (await response.json()) as FlashcardDTO;

      // Update flashcard in local state
      setSet((prev) => ({
        ...prev,
        flashcards: prev.flashcards.map((f) => (f.id === cardId ? updatedFlashcard : f)),
        updated_at: new Date().toISOString(),
      }));

      toast.success("Zaktualizowano fiszkę");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd podczas aktualizacji fiszki";
      toast.error(message);
      throw err;
    }
  }, []);

  /**
   * Deletes a flashcard
   * DELETE /api/flashcards/:id
   */
  const deleteFlashcard = useCallback(async (cardId: string) => {
    try {
      const response = await fetch(`/api/flashcards/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDTO;
        throw new Error(errorData.error?.message || "Nie udało się usunąć fiszki");
      }

      // Remove flashcard from local state
      setSet((prev) => ({
        ...prev,
        flashcards: prev.flashcards.filter((f) => f.id !== cardId),
        updated_at: new Date().toISOString(),
      }));

      toast.success("Usunięto fiszkę");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd podczas usuwania fiszki";
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    set,
    isUpdatingName,
    isAddingFlashcard,
    updateSetName,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
  };
}
