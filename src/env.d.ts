/// <reference types="astro/client" />

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Database } from "./db/database.types.ts";
import type { SupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string | undefined;
      } | null;
      supabase: SupabaseClient;
    }
  }
}

// Note: Environment variables are now managed through astro:env module
// Import them from "astro:env/server" for server-side secrets:
//   import { SUPABASE_URL, SUPABASE_KEY, OPENROUTER_API_KEY } from "astro:env/server";
// Import from "astro:env/client" for public client-side variables:
//   import { USE_MOCK_AI } from "astro:env/client";
//
// Schema is defined in astro.config.mjs under env.schema
