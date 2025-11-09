import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const DEFAULT_USER_ID = "8fcb0122-f243-4b3e-b074-330a15047647";

// Export typed SupabaseClient for use across the application
export type SupabaseClient = BaseSupabaseClient<Database>;
