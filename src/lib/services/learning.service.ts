/**
 * Learning Service
 *
 * Handles spaced repetition learning logic using the FSRS algorithm:
 * - Getting due flashcards for a learning session
 * - Processing user reviews and updating progress
 * - Managing user_flashcard_progress records
 */

import { createEmptyCard, fsrs, Rating, type Card, type RecordLogItem, type Grade } from "ts-fsrs";
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FlashcardWithProgressDTO,
  UserFlashcardProgressDTO,
  GetLearningQueueResponseDTO,
  SubmitReviewResponseDTO,
  FSRSRating,
  FSRSCardState,
} from "../../types";
import type { TablesInsert, TablesUpdate } from "../../db/database.types";

// ============================================================================
// FSRS Configuration
// ============================================================================

/**
 * FSRS scheduler instance with default parameters
 * Can be customized per user in the future
 */
const scheduler = fsrs();

// ============================================================================
// Custom Errors
// ============================================================================

/**
 * Error thrown when a database operation fails
 */
export class LearningDatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LearningDatabaseError";
  }
}

/**
 * Error thrown when a flashcard is not found
 */
export class FlashcardNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardNotFoundError";
  }
}

/**
 * Error thrown when user doesn't have access to a resource
 */
export class LearningAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LearningAccessDeniedError";
  }
}

/**
 * Error thrown when the FSRS algorithm encounters an issue
 */
export class AlgorithmError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AlgorithmError";
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps our FSRSRating type to ts-fsrs Grade type
 */
function mapRatingToFSRS(rating: FSRSRating): Grade {
  switch (rating) {
    case 1:
      return Rating.Again;
    case 2:
      return Rating.Hard;
    case 3:
      return Rating.Good;
    case 4:
      return Rating.Easy;
    default:
      return Rating.Good;
  }
}

/**
 * Maps FSRS State to our FSRSCardState type
 */
function mapStateToString(state: number): FSRSCardState {
  switch (state) {
    case 0:
      return "new";
    case 1:
      return "learning";
    case 2:
      return "review";
    case 3:
      return "relearning";
    default:
      return "new";
  }
}

/**
 * Maps our FSRSCardState to FSRS State number
 */
function mapStateToNumber(state: FSRSCardState): number {
  switch (state) {
    case "new":
      return 0;
    case "learning":
      return 1;
    case "review":
      return 2;
    case "relearning":
      return 3;
    default:
      return 0;
  }
}

/**
 * Creates a Card object from database progress record
 */
function createCardFromProgress(progress: {
  state: FSRSCardState;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  last_review: string | null;
  next_review: string;
}): Card {
  return {
    due: new Date(progress.next_review),
    stability: progress.stability,
    difficulty: progress.difficulty,
    elapsed_days: progress.elapsed_days,
    scheduled_days: progress.scheduled_days,
    reps: progress.reps,
    lapses: progress.lapses,
    learning_steps: progress.learning_steps,
    state: mapStateToNumber(progress.state),
    last_review: progress.last_review ? new Date(progress.last_review) : undefined,
  };
}

/**
 * Maps a Card object to database update fields
 */
function mapCardToDbUpdate(card: Card): Partial<TablesUpdate<"user_flashcard_progress">> {
  return {
    state: mapStateToString(card.state) as FSRSCardState,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learning_steps,
    last_review: card.last_review ? card.last_review.toISOString() : null,
    next_review: card.due.toISOString(),
  };
}

/**
 * Maps progress record to DTO (excludes user_id)
 */
function mapProgressToDTO(progress: {
  id: string;
  flashcard_id: string;
  state: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  last_review: string | null;
  next_review: string;
}): UserFlashcardProgressDTO {
  return {
    id: progress.id,
    flashcard_id: progress.flashcard_id,
    state: progress.state as FSRSCardState,
    stability: progress.stability,
    difficulty: progress.difficulty,
    elapsed_days: progress.elapsed_days,
    scheduled_days: progress.scheduled_days,
    reps: progress.reps,
    lapses: progress.lapses,
    learning_steps: progress.learning_steps,
    last_review: progress.last_review,
    next_review: progress.next_review,
  };
}

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Gets flashcards due for review in a learning session
 *
 * @param userId - The ID of the user
 * @param setId - The ID of the flashcard set to study
 * @param limit - Maximum number of cards to return (default: 20)
 * @param supabase - Supabase client instance
 * @returns Queue of flashcards with their progress data
 * @throws {LearningAccessDeniedError} When user doesn't own the set
 * @throws {LearningDatabaseError} When database query fails
 */
export async function getDueFlashcards(
  userId: string,
  setId: string,
  limit = 20,
  supabase: SupabaseClient
): Promise<GetLearningQueueResponseDTO> {
  try {
    // Step 1: Verify user owns the flashcard set
    const { data: flashcardSet, error: setError } = await supabase
      .from("flashcard_sets")
      .select("id, user_id")
      .eq("id", setId)
      .single();

    if (setError) {
      if (setError.code === "PGRST116") {
        throw new LearningAccessDeniedError(`Flashcard set with ID ${setId} not found`);
      }
      throw new LearningDatabaseError("Failed to verify flashcard set ownership", setError);
    }

    if (flashcardSet.user_id !== userId) {
      throw new LearningAccessDeniedError("You do not have permission to study this flashcard set");
    }

    // Step 2: Get all flashcards from the set
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("set_id", setId);

    if (flashcardsError) {
      throw new LearningDatabaseError("Failed to fetch flashcards", flashcardsError);
    }

    if (!flashcards || flashcards.length === 0) {
      return {
        queue: [],
        totalDue: 0,
        totalNew: 0,
      };
    }

    // Step 3: Get progress records for these flashcards
    const flashcardIds = flashcards.map((f) => f.id);
    const { data: progressRecords, error: progressError } = await supabase
      .from("user_flashcard_progress")
      .select("*")
      .eq("user_id", userId)
      .in("flashcard_id", flashcardIds);

    if (progressError) {
      throw new LearningDatabaseError("Failed to fetch progress records", progressError);
    }

    // Step 4: Create a map of progress by flashcard_id
    const progressMap = new Map(progressRecords?.map((p) => [p.flashcard_id, p]) ?? []);

    // Step 5: Build the queue - cards that are due (next_review <= now) or new
    const now = new Date();
    const queue: FlashcardWithProgressDTO[] = [];
    let totalDue = 0;
    let totalNew = 0;

    for (const flashcard of flashcards) {
      const progress = progressMap.get(flashcard.id);

      if (!progress) {
        // New card - never reviewed
        totalNew++;
        totalDue++;
        queue.push({
          flashcard,
          progress: null,
        });
      } else {
        const nextReview = new Date(progress.next_review);
        if (nextReview <= now) {
          // Due for review
          totalDue++;
          queue.push({
            flashcard,
            progress: mapProgressToDTO(progress),
          });
        }
      }
    }

    // Step 6: Sort queue - new cards first, then by next_review date
    queue.sort((a, b) => {
      // New cards (no progress) come first
      if (!a.progress && b.progress) return -1;
      if (a.progress && !b.progress) return 1;
      if (!a.progress && !b.progress) return 0;

      // Both have progress - sort by next_review (earliest first)
      if (a.progress && b.progress) {
        const aDate = new Date(a.progress.next_review);
        const bDate = new Date(b.progress.next_review);
        return aDate.getTime() - bDate.getTime();
      }
      return 0;
    });

    // Step 7: Apply limit
    const limitedQueue = queue.slice(0, limit);

    return {
      queue: limitedQueue,
      totalDue,
      totalNew,
    };
  } catch (error) {
    if (error instanceof LearningAccessDeniedError || error instanceof LearningDatabaseError) {
      throw error;
    }
    throw new LearningDatabaseError("Unexpected error fetching due flashcards", error);
  }
}

/**
 * Processes a user's review of a flashcard
 *
 * @param userId - The ID of the user
 * @param flashcardId - The ID of the flashcard being reviewed
 * @param rating - User's rating (1=Again, 2=Hard, 3=Good, 4=Easy)
 * @param supabase - Supabase client instance
 * @returns Updated progress data
 * @throws {FlashcardNotFoundError} When flashcard doesn't exist
 * @throws {LearningAccessDeniedError} When user doesn't own the flashcard's set
 * @throws {LearningDatabaseError} When database operation fails
 * @throws {AlgorithmError} When FSRS calculation fails
 */
export async function processReview(
  userId: string,
  flashcardId: string,
  rating: FSRSRating,
  supabase: SupabaseClient
): Promise<SubmitReviewResponseDTO> {
  try {
    // Step 1: Verify flashcard exists and user has access
    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .select("id, set_id, flashcard_sets!inner(user_id)")
      .eq("id", flashcardId)
      .single();

    if (flashcardError) {
      if (flashcardError.code === "PGRST116") {
        throw new FlashcardNotFoundError(`Flashcard with ID ${flashcardId} not found`);
      }
      throw new LearningDatabaseError("Failed to verify flashcard", flashcardError);
    }

    // Check ownership through the joined flashcard_sets
    const setOwner = (flashcard.flashcard_sets as unknown as { user_id: string }).user_id;
    if (setOwner !== userId) {
      throw new LearningAccessDeniedError("You do not have permission to review this flashcard");
    }

    // Step 2: Get existing progress record
    const { data: existingProgress, error: progressError } = await supabase
      .from("user_flashcard_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("flashcard_id", flashcardId)
      .single();

    // PGRST116 means no record found - that's okay for new cards
    if (progressError && progressError.code !== "PGRST116") {
      throw new LearningDatabaseError("Failed to fetch progress record", progressError);
    }

    // Step 3: Create or reconstruct the card
    const now = new Date();
    let card: Card;
    let schedulingResult: RecordLogItem;

    try {
      if (existingProgress) {
        // Reconstruct card from existing progress
        card = createCardFromProgress(existingProgress);
      } else {
        // Create new empty card
        card = createEmptyCard(now);
      }

      // Step 4: Calculate next state using FSRS
      // Use the next() method which directly returns the result for a specific rating
      const fsrsRating = mapRatingToFSRS(rating);
      schedulingResult = scheduler.next(card, now, fsrsRating);
      card = schedulingResult.card;
    } catch (error) {
      throw new AlgorithmError("Failed to calculate next review state", error);
    }

    // Step 5: Prepare database update
    const progressData = mapCardToDbUpdate(card);

    let updatedProgress;

    if (existingProgress) {
      // Update existing record
      const { data: updated, error: updateError } = await supabase
        .from("user_flashcard_progress")
        .update(progressData)
        .eq("id", existingProgress.id)
        .select("*")
        .single();

      if (updateError) {
        throw new LearningDatabaseError("Failed to update progress record", updateError);
      }
      updatedProgress = updated;
    } else {
      // Insert new record
      const insertData: TablesInsert<"user_flashcard_progress"> = {
        user_id: userId,
        flashcard_id: flashcardId,
        ...progressData,
      } as TablesInsert<"user_flashcard_progress">;

      const { data: inserted, error: insertError } = await supabase
        .from("user_flashcard_progress")
        .insert(insertData)
        .select("*")
        .single();

      if (insertError) {
        throw new LearningDatabaseError("Failed to create progress record", insertError);
      }
      updatedProgress = inserted;
    }

    // Step 6: Return response
    return {
      progress: mapProgressToDTO(updatedProgress),
      nextReview: card.due.toISOString(),
    };
  } catch (error) {
    if (
      error instanceof FlashcardNotFoundError ||
      error instanceof LearningAccessDeniedError ||
      error instanceof LearningDatabaseError ||
      error instanceof AlgorithmError
    ) {
      throw error;
    }
    throw new LearningDatabaseError("Unexpected error processing review", error);
  }
}

/**
 * Gets statistics for a flashcard set's learning progress
 *
 * @param userId - The ID of the user
 * @param setId - The ID of the flashcard set
 * @param supabase - Supabase client instance
 * @returns Learning statistics
 */
export async function getLearningStats(
  userId: string,
  setId: string,
  supabase: SupabaseClient
): Promise<{
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
}> {
  try {
    // Get flashcards in the set
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("set_id", setId);

    if (flashcardsError) {
      throw new LearningDatabaseError("Failed to fetch flashcards", flashcardsError);
    }

    const totalCards = flashcards?.length ?? 0;
    if (totalCards === 0) {
      return {
        totalCards: 0,
        newCards: 0,
        learningCards: 0,
        reviewCards: 0,
        dueCards: 0,
      };
    }

    const flashcardIds = flashcards.map((f) => f.id);

    // Get progress records
    const { data: progressRecords, error: progressError } = await supabase
      .from("user_flashcard_progress")
      .select("state, next_review")
      .eq("user_id", userId)
      .in("flashcard_id", flashcardIds);

    if (progressError) {
      throw new LearningDatabaseError("Failed to fetch progress records", progressError);
    }

    const now = new Date();

    const newCards = totalCards - (progressRecords?.length ?? 0);
    let learningCards = 0;
    let reviewCards = 0;
    let dueCards = newCards; // New cards are always due

    for (const progress of progressRecords ?? []) {
      if (progress.state === "learning" || progress.state === "relearning") {
        learningCards++;
      } else if (progress.state === "review") {
        reviewCards++;
      }

      const nextReview = new Date(progress.next_review);
      if (nextReview <= now) {
        dueCards++;
      }
    }

    return {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      dueCards,
    };
  } catch (error) {
    if (error instanceof LearningDatabaseError) {
      throw error;
    }
    throw new LearningDatabaseError("Unexpected error fetching learning stats", error);
  }
}
