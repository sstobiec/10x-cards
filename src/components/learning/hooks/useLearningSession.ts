/**
 * Hook for managing a learning session with spaced repetition
 *
 * Handles:
 * - Fetching due flashcards for a set
 * - Processing user reviews (ratings)
 * - Tracking session progress and statistics
 * - Optimistic updates for smooth UX
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type {
  FlashcardWithProgressDTO,
  GetLearningQueueResponseDTO,
  SubmitReviewResponseDTO,
  FSRSRating,
  ErrorResponseDTO,
} from "@/types";

// ============================================================================
// Types
// ============================================================================

export type SessionState = "loading" | "ready" | "studying" | "completed" | "error";

export interface SessionStats {
  /** Total cards studied in this session */
  cardsStudied: number;
  /** Cards rated as "Again" (forgotten) */
  againCount: number;
  /** Cards rated as "Hard" */
  hardCount: number;
  /** Cards rated as "Good" */
  goodCount: number;
  /** Cards rated as "Easy" */
  easyCount: number;
  /** Session start time */
  startTime: Date;
  /** Session end time (null if in progress) */
  endTime: Date | null;
}

export interface UseLearningSessionReturn {
  /** Current session state */
  state: SessionState;
  /** Current flashcard queue */
  queue: FlashcardWithProgressDTO[];
  /** Index of currently displayed flashcard */
  currentIndex: number;
  /** Currently displayed flashcard */
  currentCard: FlashcardWithProgressDTO | null;
  /** Whether the card is flipped (showing answer) */
  isFlipped: boolean;
  /** Session statistics */
  stats: SessionStats;
  /** Total cards due for review */
  totalDue: number;
  /** Total new cards (never reviewed) */
  totalNew: number;
  /** Error message if any */
  error: string | null;
  /** Whether a review is being submitted */
  isSubmitting: boolean;
  /** Flip the current card */
  flipCard: () => void;
  /** Submit a rating for the current card */
  submitGrade: (rating: FSRSRating) => Promise<void>;
  /** Skip to next card without rating */
  skipCard: () => void;
  /** Restart the session */
  restartSession: () => Promise<void>;
  /** Fetch/refresh the queue */
  fetchQueue: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useLearningSession(setId: string, limit = 20): UseLearningSessionReturn {
  // Queue and navigation state
  const [queue, setQueue] = useState<FlashcardWithProgressDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Session metadata
  const [state, setState] = useState<SessionState>("loading");
  const [totalDue, setTotalDue] = useState(0);
  const [totalNew, setTotalNew] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session statistics
  const [stats, setStats] = useState<SessionStats>({
    cardsStudied: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    startTime: new Date(),
    endTime: null,
  });

  // Current card derived from queue and index
  const currentCard = useMemo(() => {
    if (queue.length === 0 || currentIndex >= queue.length) {
      return null;
    }
    return queue[currentIndex];
  }, [queue, currentIndex]);

  /**
   * Fetches the learning queue from the API
   */
  const fetchQueue = useCallback(async () => {
    setState("loading");
    setError(null);

    try {
      const response = await fetch(`/api/learning/queue?setId=${setId}&limit=${limit}`);

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDTO;

        if (response.status === 403) {
          throw new Error("Nie masz dostępu do tego zestawu");
        }

        throw new Error(errorData.error?.message || "Nie udało się pobrać fiszek do nauki");
      }

      const data = (await response.json()) as GetLearningQueueResponseDTO;

      setQueue(data.queue);
      setTotalDue(data.totalDue);
      setTotalNew(data.totalNew);
      setCurrentIndex(0);
      setIsFlipped(false);

      if (data.queue.length === 0) {
        setState("completed");
      } else {
        setState("studying");
      }

      // Reset stats for new session
      setStats({
        cardsStudied: 0,
        againCount: 0,
        hardCount: 0,
        goodCount: 0,
        easyCount: 0,
        startTime: new Date(),
        endTime: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(message);
      setState("error");
    }
  }, [setId, limit]);

  /**
   * Flips the current card (shows/hides answer)
   */
  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  /**
   * Submits a grade for the current card
   */
  const submitGrade = useCallback(
    async (rating: FSRSRating) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/learning/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            flashcardId: currentCard.flashcard.id,
            rating,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponseDTO;
          throw new Error(errorData.error?.message || "Nie udało się zapisać oceny");
        }

        const result = (await response.json()) as SubmitReviewResponseDTO;

        // Update stats
        setStats((prev) => ({
          ...prev,
          cardsStudied: prev.cardsStudied + 1,
          againCount: prev.againCount + (rating === 1 ? 1 : 0),
          hardCount: prev.hardCount + (rating === 2 ? 1 : 0),
          goodCount: prev.goodCount + (rating === 3 ? 1 : 0),
          easyCount: prev.easyCount + (rating === 4 ? 1 : 0),
        }));

        // Update the card's progress in the queue (optimistic update)
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === currentIndex
              ? {
                  ...item,
                  progress: result.progress,
                }
              : item
          )
        );

        // Move to next card
        const nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
          // Session completed
          setState("completed");
          setStats((prev) => ({
            ...prev,
            endTime: new Date(),
          }));
          toast.success("Gratulacje! Ukończyłeś sesję nauki 🎉");
        } else {
          // Move to next card
          setCurrentIndex(nextIndex);
          setIsFlipped(false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania oceny";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, currentIndex, queue.length, isSubmitting]
  );

  /**
   * Skips the current card without rating
   */
  const skipCard = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      setState("completed");
      setStats((prev) => ({
        ...prev,
        endTime: new Date(),
      }));
    } else {
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
    }
  }, [currentIndex, queue.length]);

  /**
   * Restarts the learning session
   */
  const restartSession = useCallback(async () => {
    await fetchQueue();
  }, [fetchQueue]);

  // Initial fetch on mount
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return {
    state,
    queue,
    currentIndex,
    currentCard,
    isFlipped,
    stats,
    totalDue,
    totalNew,
    error,
    isSubmitting,
    flipCard,
    submitGrade,
    skipCard,
    restartSession,
    fetchQueue,
  };
}
