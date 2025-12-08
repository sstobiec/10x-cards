/**
 * Flashcard Service
 *
 * Handles business logic for individual flashcard operations including:
 * - Creating a flashcard in a specific set
 * - Updating flashcard content
 * - Deleting a flashcard
 * - Toggling flashcard flag status
 */

import type { SupabaseClient } from "../db/supabase.client";
import type {
  CreateFlashcardRequestDTO,
  UpdateFlashcardRequestDTO,
  FlashcardDTO,
  ToggleFlashcardFlagResponseDTO,
} from "../types";

// ============================================================================
// Custom Errors
// ============================================================================

export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class FlashcardOperationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FlashcardOperationError";
  }
}

// ============================================================================
// Service Methods
// ============================================================================

/**
 * Creates a new flashcard in a specific set
 */
export async function createFlashcard(
  supabase: SupabaseClient,
  userId: string,
  setId: string,
  data: CreateFlashcardRequestDTO
): Promise<FlashcardDTO> {
  try {
    // 1. Verify Set ownership and existence
    const { data: set, error: setError } = await supabase
      .from("flashcard_sets")
      .select("id, user_id")
      .eq("id", setId)
      .single();

    if (setError || !set) {
      // If error is PGRST116 (0 rows), it's not found.
      // We generally return 404 if set doesn't exist or user doesn't own it (security through obscurity if preferred,
      // but here explicit checking helps).
      // Since RLS might hide it, 'not found' is appropriate for both missing and unauthorized in many secure designs.
      // However, to follow the spec:
      // "403 Forbidden - Set belongs to another user (RLS)"
      // "404 Not Found - Set with given ID doesn't exist"
      // Without bypassing RLS (service role), we can't distinguish 403 vs 404 easily if RLS returns empty.
      // Assuming standard authenticated client is passed:
      throw new ResourceNotFoundError(`Flashcard set with ID ${setId} not found`);
    }

    if (set.user_id !== userId) {
      throw new AccessDeniedError("You do not have permission to add flashcards to this set");
    }

    // 2. Insert Flashcard
    const { data: flashcard, error: insertError } = await supabase
      .from("flashcards")
      .insert({
        set_id: setId,
        avers: data.avers,
        rewers: data.rewers,
        source: data.source,
      })
      .select()
      .single();

    if (insertError) {
      throw new FlashcardOperationError("Failed to create flashcard", insertError);
    }

    return flashcard;
  } catch (error) {
    if (error instanceof ResourceNotFoundError || error instanceof AccessDeniedError) {
      throw error;
    }
    throw new FlashcardOperationError("Unexpected error creating flashcard", error);
  }
}

/**
 * Updates an existing flashcard
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: string,
  data: UpdateFlashcardRequestDTO
): Promise<FlashcardDTO> {
  try {
    // 1. Verify Flashcard ownership via Set
    // We join with flashcard_sets to check user_id
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("*, flashcard_sets!inner(user_id)")
      .eq("id", flashcardId)
      .single();

    if (fetchError || !existingFlashcard) {
      throw new ResourceNotFoundError(`Flashcard with ID ${flashcardId} not found`);
    }

    // Check ownership
    // @ts-expect-error - Joined property isn't in the generated type definition automatically unless typed explicitly, but exists at runtime.
    if (existingFlashcard.flashcard_sets.user_id !== userId) {
      throw new AccessDeniedError("You do not have permission to update this flashcard");
    }

    // 2. Perform Update
    // Note: 'source' update logic (ai-full -> ai-edited) is handled by DB trigger as per spec,
    // or we can handle it here if we want to be explicit.
    // The spec says: "Database trigger automatically updates source..."
    // We only send avers/rewers.

    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({
        avers: data.avers,
        rewers: data.rewers,
      })
      .eq("id", flashcardId)
      .select()
      .single();

    if (updateError) {
      throw new FlashcardOperationError("Failed to update flashcard", updateError);
    }

    return updatedFlashcard;
  } catch (error) {
    if (error instanceof ResourceNotFoundError || error instanceof AccessDeniedError) {
      throw error;
    }
    throw new FlashcardOperationError("Unexpected error updating flashcard", error);
  }
}

/**
 * Deletes a flashcard
 */
export async function deleteFlashcard(supabase: SupabaseClient, userId: string, flashcardId: string): Promise<void> {
  try {
    // 1. Verify existence and ownership
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("flashcard_sets!inner(user_id)")
      .eq("id", flashcardId)
      .single();

    if (fetchError || !existingFlashcard) {
      throw new ResourceNotFoundError(`Flashcard with ID ${flashcardId} not found`);
    }

    // @ts-expect-error - Joined property
    if (existingFlashcard.flashcard_sets.user_id !== userId) {
      throw new AccessDeniedError("You do not have permission to delete this flashcard");
    }

    // 2. Delete
    const { error: deleteError } = await supabase.from("flashcards").delete().eq("id", flashcardId);

    if (deleteError) {
      throw new FlashcardOperationError("Failed to delete flashcard", deleteError);
    }
  } catch (error) {
    if (error instanceof ResourceNotFoundError || error instanceof AccessDeniedError) {
      throw error;
    }
    throw new FlashcardOperationError("Unexpected error deleting flashcard", error);
  }
}

/**
 * Toggles the flagged status of a flashcard
 */
export async function toggleFlashcardFlag(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: string,
  flagged: boolean
): Promise<ToggleFlashcardFlagResponseDTO> {
  try {
    // 1. Verify existence and ownership
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("flashcard_sets!inner(user_id)")
      .eq("id", flashcardId)
      .single();

    if (fetchError || !existingFlashcard) {
      throw new ResourceNotFoundError(`Flashcard with ID ${flashcardId} not found`);
    }

    // @ts-expect-error - Joined property
    if (existingFlashcard.flashcard_sets.user_id !== userId) {
      throw new AccessDeniedError("You do not have permission to modify this flashcard");
    }

    // 2. Update flag
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({ flagged })
      .eq("id", flashcardId)
      .select("id, flagged, updated_at")
      .single();

    if (updateError) {
      throw new FlashcardOperationError("Failed to toggle flashcard flag", updateError);
    }

    return updatedFlashcard;
  } catch (error) {
    if (error instanceof ResourceNotFoundError || error instanceof AccessDeniedError) {
      throw error;
    }
    throw new FlashcardOperationError("Unexpected error toggling flashcard flag", error);
  }
}
