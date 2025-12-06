/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Global Teardown for E2E Tests
 *
 * This function runs after all E2E tests complete.
 * It cleans up test data created during test execution.
 */
async function globalTeardown(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;
  const testUserPassword = process.env.E2E_PASSWORD;

  // Validate required environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Teardown] Missing SUPABASE_URL or SUPABASE_KEY. Skipping cleanup.");
    return;
  }

  if (!testUserEmail || !testUserPassword) {
    console.warn("[Teardown] Missing E2E_USERNAME or E2E_PASSWORD. Skipping cleanup.");
    return;
  }

  console.log("[Teardown] Starting cleanup for test user:", testUserEmail);

  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Authenticate as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testUserEmail,
    password: testUserPassword,
  });

  if (authError || !authData.user) {
    console.error("[Teardown] Failed to authenticate test user:", authError?.message);
    return;
  }

  const testUserId = authData.user.id;
  console.log("[Teardown] Authenticated as test user:", testUserId);

  try {
    // Step 1: Get all flashcard sets for the test user
    const { data: flashcardSets, error: setsError } = await supabase
      .from("flashcard_sets")
      .select("id, name")
      .eq("user_id", testUserId);

    if (setsError) {
      console.error("[Teardown] Error fetching flashcard sets:", setsError.message);
      return;
    }

    if (!flashcardSets || flashcardSets.length === 0) {
      console.log("[Teardown] No flashcard sets found for test user. Nothing to clean up.");
      return;
    }

    console.log(`[Teardown] Found ${flashcardSets.length} flashcard set(s) to delete.`);

    // Step 2: Delete all flashcards associated with these sets
    const setIds = flashcardSets.map((set) => set.id);

    const { error: flashcardsDeleteError, count: flashcardsDeleted } = await supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .in("set_id", setIds);

    if (flashcardsDeleteError) {
      console.error("[Teardown] Error deleting flashcards:", flashcardsDeleteError.message);
      return;
    }

    console.log(`[Teardown] Deleted ${flashcardsDeleted ?? 0} flashcard(s).`);

    // Step 3: Delete all flashcard sets for the test user
    const { error: setsDeleteError, count: setsDeleted } = await supabase
      .from("flashcard_sets")
      .delete({ count: "exact" })
      .eq("user_id", testUserId);

    if (setsDeleteError) {
      console.error("[Teardown] Error deleting flashcard sets:", setsDeleteError.message);
      return;
    }

    console.log(`[Teardown] Deleted ${setsDeleted ?? 0} flashcard set(s).`);

    // Step 4: Delete error logs for the test user (optional cleanup)
    const { error: logsDeleteError, count: logsDeleted } = await supabase
      .from("error_logs")
      .delete({ count: "exact" })
      .eq("user_id", testUserId);

    if (logsDeleteError) {
      console.error("[Teardown] Error deleting error logs:", logsDeleteError.message);
    } else {
      console.log(`[Teardown] Deleted ${logsDeleted ?? 0} error log(s).`);
    }

    console.log("[Teardown] Cleanup completed successfully.");
  } catch (error) {
    console.error("[Teardown] Unexpected error during cleanup:", error);
  } finally {
    // Sign out the test user
    await supabase.auth.signOut();
  }
}

export default globalTeardown;
