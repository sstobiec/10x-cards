// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://10x-cards.pages.dev",
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: "compile",
  }),
  env: {
    schema: {
      // Supabase configuration (required at runtime)
      SUPABASE_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      // OpenRouter AI configuration (optional - mock used if not set)
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Feature flags
      USE_MOCK_AI: envField.boolean({
        context: "server",
        access: "public",
        default: false,
      }),
    },
    // Don't validate secrets at build time - Cloudflare injects them at runtime
    // Secrets will be validated when first accessed
    validateSecrets: false,
  },
});
