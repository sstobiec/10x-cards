/// <reference types="astro/client" />

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string | undefined;
      } | null;
    }
  }
}

// Note: Environment variables are now type-safe via astro:env module
// Import them from "astro:env/server" or "astro:env/client" as needed
// See: astro.config.mjs env.schema for available variables
