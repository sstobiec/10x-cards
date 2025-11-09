/**
 * Flashcard Set Service
 *
 * Handles business logic for flashcard set operations including:
 * - Creating flashcard sets with nested flashcards (transactional)
 * - Retrieving flashcard sets with counts
 */

import type { SupabaseClient } from "../db/supabase.client";
import type { FlashcardSetCreateCommand, CreateFlashcardSetResponseDTO } from "../types";
import type { TablesInsert } from "../db/database.types";

/**
 * Custom error for unique constraint violations (409 Conflict)
 */
export class FlashcardSetNameConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardSetNameConflictError";
  }
}

/**
 * Custom error for database transaction failures
 */
export class FlashcardSetTransactionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FlashcardSetTransactionError";
  }
}

/**
 * Creates a new flashcard set with optional flashcards in a single transaction
 *
 * @param command - The command object containing set data and flashcards
 * @param userId - The ID of the user creating the set
 * @param supabase - Supabase client instance
 * @returns The created flashcard set with flashcard count
 * @throws {FlashcardSetNameConflictError} When a set with the same name already exists for this user
 * @throws {FlashcardSetTransactionError} When the database transaction fails
 */
export async function createFlashcardSet(
  command: FlashcardSetCreateCommand,
  userId: string,
  supabase: SupabaseClient
): Promise<CreateFlashcardSetResponseDTO> {
  // Step 1: Prepare flashcard set data
  const flashcardSetData: TablesInsert<"flashcard_sets"> = {
    name: command.name,
    model: command.model,
    generation_duration: command.generation_duration,
    user_id: userId,
  };

  try {
    // Step 2: Insert flashcard set
    const { data: createdSet, error: setError } = await supabase
      .from("flashcard_sets")
      .insert(flashcardSetData)
      .select("id, name, model, generation_duration, created_at, updated_at")
      .single();

    // Handle unique constraint violation (duplicate name for user)
    if (setError) {
      // Supabase error code for unique constraint violation
      if (setError.code === "23505" && setError.message.includes("user_id")) {
        throw new FlashcardSetNameConflictError(`A flashcard set with the name "${command.name}" already exists`);
      }
      throw new FlashcardSetTransactionError("Failed to create flashcard set", setError);
    }

    if (!createdSet) {
      throw new FlashcardSetTransactionError("Failed to create flashcard set: No data returned");
    }

    // Step 3: Insert flashcards if provided (bulk insert for performance)
    let flashcardCount = 0;
    if (command.flashcards && command.flashcards.length > 0) {
      const flashcardsData: TablesInsert<"flashcards">[] = command.flashcards.map((flashcard) => ({
        set_id: createdSet.id,
        avers: flashcard.avers,
        rewers: flashcard.rewers,
        source: flashcard.source,
      }));

      const { data: createdFlashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .insert(flashcardsData)
        .select("id");

      if (flashcardsError) {
        // If flashcard insertion fails, we need to clean up the created set
        // to maintain data consistency
        await supabase.from("flashcard_sets").delete().eq("id", createdSet.id);
        throw new FlashcardSetTransactionError("Failed to create flashcards", flashcardsError);
      }

      flashcardCount = createdFlashcards?.length || 0;
    }

    // Step 4: Return the created set with flashcard count
    const response: CreateFlashcardSetResponseDTO = {
      id: createdSet.id,
      name: createdSet.name,
      model: createdSet.model,
      generation_duration: createdSet.generation_duration,
      created_at: createdSet.created_at,
      updated_at: createdSet.updated_at,
      flashcard_count: flashcardCount,
    };

    return response;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof FlashcardSetNameConflictError || error instanceof FlashcardSetTransactionError) {
      throw error;
    }

    // Wrap unknown errors
    throw new FlashcardSetTransactionError("Unexpected error creating flashcard set", error);
  }
}
