import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type {
  FlashcardSetListItemDTO,
  PaginationMetaDTO,
  PaginatedResponseDTO,
  CreateFlashcardSetResponseDTO,
  ErrorResponseDTO,
} from "@/types";

const DEFAULT_LIMIT = 12;

interface DashboardState {
  sets: FlashcardSetListItemDTO[];
  pagination: PaginationMetaDTO;
  isLoading: boolean;
  error: string | null;
}

interface UseDashboardSetsReturn extends DashboardState {
  fetchSets: (page?: number) => Promise<void>;
  createSet: (name: string) => Promise<CreateFlashcardSetResponseDTO>;
  deleteSet: (id: string) => Promise<void>;
  currentPage: number;
  totalPages: number;
  isCreating: boolean;
  isDeleting: boolean;
}

export function useDashboardSets(): UseDashboardSetsReturn {
  const [state, setState] = useState<DashboardState>({
    sets: [],
    pagination: { total: 0, limit: DEFAULT_LIMIT, offset: 0 },
    isLoading: true,
    error: null,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPage = Math.floor(state.pagination.offset / state.pagination.limit) + 1;
  const totalPages = Math.ceil(state.pagination.total / state.pagination.limit);

  const fetchSets = useCallback(async (page = 1) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const offset = (page - 1) * DEFAULT_LIMIT;

    try {
      const response = await fetch(`/api/flashcard-sets?limit=${DEFAULT_LIMIT}&offset=${offset}`);

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDTO;
        throw new Error(errorData.error?.message || "Nie udało się pobrać zestawów fiszek");
      }

      const data = (await response.json()) as PaginatedResponseDTO<FlashcardSetListItemDTO>;

      setState({
        sets: data.data,
        pagination: data.pagination,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      // Optional: don't toast on initial load error, just show error state
    }
  }, []);

  const createSet = useCallback(async (name: string): Promise<CreateFlashcardSetResponseDTO> => {
    setIsCreating(true);

    try {
      const response = await fetch("/api/flashcard-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          model: "manual",
          generation_duration: 0,
          flashcards: [],
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDTO;

        if (response.status === 409) {
          throw new Error("Zestaw o tej nazwie już istnieje");
        }

        throw new Error(errorData.error?.message || "Nie udało się utworzyć zestawu");
      }

      const data = (await response.json()) as CreateFlashcardSetResponseDTO;
      toast.success("Zestaw został utworzony pomyślnie");
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd podczas tworzenia zestawu";
      toast.error(message);
      throw err; // Re-throw so the component can handle it (e.g. keep dialog open)
    } finally {
      setIsCreating(false);
    }
  }, []);

  const deleteSet = useCallback(
    async (id: string): Promise<void> => {
      setIsDeleting(true);

      try {
        const response = await fetch(`/api/flashcard-sets/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponseDTO;
          throw new Error(errorData.error?.message || "Nie udało się usunąć zestawu");
        }

        toast.success("Zestaw został usunięty");

        // After successful deletion, check if we need to go back a page
        const remainingSets = state.sets.filter((set) => set.id !== id);

        if (remainingSets.length === 0 && currentPage > 1) {
          // Go to previous page if current page is now empty
          await fetchSets(currentPage - 1);
        } else {
          // Refresh current page
          await fetchSets(currentPage);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Wystąpił błąd podczas usuwania";
        toast.error(message);
      } finally {
        setIsDeleting(false);
      }
    },
    [state.sets, currentPage, fetchSets]
  );

  // Initial fetch
  useEffect(() => {
    fetchSets(1);
  }, [fetchSets]);

  return {
    sets: state.sets,
    pagination: state.pagination,
    isLoading: state.isLoading,
    error: state.error,
    fetchSets,
    createSet,
    deleteSet,
    currentPage,
    totalPages,
    isCreating,
    isDeleting,
  };
}
