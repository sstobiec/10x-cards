/**
 * Flashcard Set Service
 *
 * Handles business logic for flashcard set operations including:
 * - Creating flashcard sets with nested flashcards (transactional)
 * - Retrieving flashcard sets with counts
 * - Listing flashcard sets (paginated)
 * - Getting flashcard set details
 * - Updating flashcard sets
 * - Deleting flashcard sets
 */

import type { SupabaseClient } from "../db/supabase.client";
import type {
  FlashcardSetCreateCommand,
  CreateFlashcardSetResponseDTO,
  FlashcardSetListItemDTO,
  FlashcardSetDetailDTO,
  PaginatedResponseDTO,
  UpdateFlashcardSetResponseDTO,
} from "../types";
import type { TablesInsert } from "../db/database.types";
import type { FlashcardSetQueryParams } from "./validation/flashcard-sets";

// ============================================================================
// Custom Errors
// ============================================================================

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
 * Custom error for resource not found (404 Not Found)
 */
export class FlashcardSetNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardSetNotFoundError";
  }
}

/**
 * Custom error for access denied (403 Forbidden)
 */
export class FlashcardSetAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardSetAccessDeniedError";
  }
}

/**
 * Custom error for general operation failures
 */
export class FlashcardSetOperationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FlashcardSetOperationError";
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

// ============================================================================
// List Flashcard Sets
// ============================================================================

/**
 * Lists flashcard sets for a user with pagination
 *
 * @param userId - The ID of the user
 * @param params - Query parameters (limit, offset, sort)
 * @param supabase - Supabase client instance
 * @returns Paginated list of flashcard sets with flashcard counts
 * @throws {FlashcardSetOperationError} When the database query fails
 */
export async function listFlashcardSets(
  userId: string,
  params: FlashcardSetQueryParams,
  supabase: SupabaseClient
): Promise<PaginatedResponseDTO<FlashcardSetListItemDTO>> {
  try {
    const { limit, offset, sort } = params;
    const ascending = sort === "created_at_asc";

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("flashcard_sets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      throw new FlashcardSetOperationError("Failed to count flashcard sets", countError);
    }

    // Fetch flashcard sets with flashcard count
    const { data: sets, error: fetchError } = await supabase
      .from("flashcard_sets")
      .select("id, name, model, generation_duration, created_at, updated_at, flashcards(count)")
      .eq("user_id", userId)
      .order("created_at", { ascending })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new FlashcardSetOperationError("Failed to fetch flashcard sets", fetchError);
    }

    // Map to DTOs with computed flashcard_count
    const items: FlashcardSetListItemDTO[] = (sets || []).map((set) => ({
      id: set.id,
      name: set.name,
      model: set.model,
      generation_duration: set.generation_duration,
      created_at: set.created_at,
      updated_at: set.updated_at,
      flashcard_count: Array.isArray(set.flashcards)
        ? set.flashcards.length
        : (set.flashcards as unknown as { count: number })?.count || 0,
    }));

    return {
      data: items,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
      },
    };
  } catch (error) {
    if (error instanceof FlashcardSetOperationError) {
      throw error;
    }
    throw new FlashcardSetOperationError("Unexpected error listing flashcard sets", error);
  }
}

// ============================================================================
// Get Flashcard Set by ID
// ============================================================================

/**
 * Gets a single flashcard set with all its flashcards
 *
 * @param setId - The ID of the flashcard set
 * @param userId - The ID of the user (for authorization)
 * @param supabase - Supabase client instance
 * @returns The flashcard set with all flashcards
 * @throws {FlashcardSetNotFoundError} When the set doesn't exist
 * @throws {FlashcardSetAccessDeniedError} When the user doesn't own the set
 * @throws {FlashcardSetOperationError} When the database query fails
 */
export async function getFlashcardSetById(
  setId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<FlashcardSetDetailDTO> {
  try {
    // Fetch set with all flashcards
    const { data: set, error: fetchError } = await supabase
      .from("flashcard_sets")
      .select("id, name, model, generation_duration, created_at, updated_at, user_id, flashcards(*)")
      .eq("id", setId)
      .single();

    if (fetchError) {
      // PGRST116 = Row not found
      if (fetchError.code === "PGRST116") {
        throw new FlashcardSetNotFoundError(`Flashcard set with ID ${setId} not found`);
      }
      throw new FlashcardSetOperationError("Failed to fetch flashcard set", fetchError);
    }

    if (!set) {
      throw new FlashcardSetNotFoundError(`Flashcard set with ID ${setId} not found`);
    }

    // Check ownership
    if (set.user_id !== userId) {
      throw new FlashcardSetAccessDeniedError("You do not have permission to access this flashcard set");
    }

    // Map to DTO (excluding user_id as per FlashcardSetDetailDTO)
    const response: FlashcardSetDetailDTO = {
      id: set.id,
      name: set.name,
      model: set.model,
      generation_duration: set.generation_duration,
      created_at: set.created_at,
      updated_at: set.updated_at,
      flashcards: set.flashcards || [],
    };

    return response;
  } catch (error) {
    if (
      error instanceof FlashcardSetNotFoundError ||
      error instanceof FlashcardSetAccessDeniedError ||
      error instanceof FlashcardSetOperationError
    ) {
      throw error;
    }
    throw new FlashcardSetOperationError("Unexpected error fetching flashcard set", error);
  }
}

// ============================================================================
// Update Flashcard Set
// ============================================================================

/**
 * Updates a flashcard set (name only)
 *
 * @param setId - The ID of the flashcard set
 * @param userId - The ID of the user (for authorization)
 * @param name - The new name for the set
 * @param supabase - Supabase client instance
 * @returns The updated flashcard set
 * @throws {FlashcardSetNotFoundError} When the set doesn't exist
 * @throws {FlashcardSetAccessDeniedError} When the user doesn't own the set
 * @throws {FlashcardSetNameConflictError} When the new name conflicts with existing set
 * @throws {FlashcardSetOperationError} When the database operation fails
 */
export async function updateFlashcardSet(
  setId: string,
  userId: string,
  name: string,
  supabase: SupabaseClient
): Promise<UpdateFlashcardSetResponseDTO> {
  try {
    // First verify the set exists and user owns it
    const { data: existingSet, error: fetchError } = await supabase
      .from("flashcard_sets")
      .select("id, user_id")
      .eq("id", setId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new FlashcardSetNotFoundError(`Flashcard set with ID ${setId} not found`);
      }
      throw new FlashcardSetOperationError("Failed to fetch flashcard set", fetchError);
    }

    if (!existingSet) {
      throw new FlashcardSetNotFoundError(`Flashcard set with ID ${setId} not found`);
    }

    if (existingSet.user_id !== userId) {
      throw new FlashcardSetAccessDeniedError("You do not have permission to update this flashcard set");
    }

    // Perform update
    const { data: updatedSet, error: updateError } = await supabase
      .from("flashcard_sets")
      .update({ name })
      .eq("id", setId)
      .select("id, name, model, generation_duration, created_at, updated_at")
      .single();

    if (updateError) {
      // Check for unique constraint violation
      if (updateError.code === "23505" && updateError.message.includes("user_id")) {
        throw new FlashcardSetNameConflictError(`A flashcard set with the name "${name}" already exists`);
      }
      throw new FlashcardSetOperationError("Failed to update flashcard set", updateError);
    }

    if (!updatedSet) {
      throw new FlashcardSetOperationError("Failed to update flashcard set: No data returned");
    }

    // Get flashcard count
    const { count: flashcardCount, error: countError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("set_id", setId);

    if (countError) {
      throw new FlashcardSetOperationError("Failed to count flashcards", countError);
    }

    const response: UpdateFlashcardSetResponseDTO = {
      id: updatedSet.id,
      name: updatedSet.name,
      model: updatedSet.model,
      generation_duration: updatedSet.generation_duration,
      created_at: updatedSet.created_at,
      updated_at: updatedSet.updated_at,
      flashcard_count: flashcardCount || 0,
    };

    return response;
  } catch (error) {
    if (
      error instanceof FlashcardSetNotFoundError ||
      error instanceof FlashcardSetAccessDeniedError ||
      error instanceof FlashcardSetNameConflictError ||
      error instanceof FlashcardSetOperationError
    ) {
      throw error;
    }
    throw new FlashcardSetOperationError("Unexpected error updating flashcard set", error);
  }
}

// ============================================================================
// Delete Flashcard Set
// ============================================================================

/**
 * Deletes a flashcard set and all its flashcards (cascade)
 *
 * @param setId - The ID of the flashcard set
 * @param userId - The ID of the user (for authorization)
 * @param supabase - Supabase client instance
 * @throws {FlashcardSetNotFoundError} When the set doesn't exist
 * @throws {FlashcardSetAccessDeniedError} When the user doesn't own the set
 * @throws {FlashcardSetOperationError} When the database operation fails
 */
export async function deleteFlashcardSet(setId: string, userId: string, supabase: SupabaseClient): Promise<void> {
  try {
    // First verify the set exists and user owns it
    const { data: existingSet, error: fetchError } = await supabase
      .from("flashcard_sets")
      .select("id, user_id")
      .eq("id", setId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new FlashcardSetNotFoundError(`Flashcard set with ID ${setId} not found`);
      }
      throw new FlashcardSetOperationError("Failed to fetch flashcard set", fetchError);
    }

    if (!existingSet) {
      throw new FlashcardSetNotFoundError(`Flashcard set with ID ${setId} not found`);
    }

    if (existingSet.user_id !== userId) {
      throw new FlashcardSetAccessDeniedError("You do not have permission to delete this flashcard set");
    }

    // Delete the set (flashcards will be cascade deleted by foreign key constraint)
    const { error: deleteError } = await supabase.from("flashcard_sets").delete().eq("id", setId);

    if (deleteError) {
      throw new FlashcardSetOperationError("Failed to delete flashcard set", deleteError);
    }
  } catch (error) {
    if (
      error instanceof FlashcardSetNotFoundError ||
      error instanceof FlashcardSetAccessDeniedError ||
      error instanceof FlashcardSetOperationError
    ) {
      throw error;
    }
    throw new FlashcardSetOperationError("Unexpected error deleting flashcard set", error);
  }
}
