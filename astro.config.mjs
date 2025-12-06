// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      resolve: {
        conditions: ["workerd", "worker", "browser"],
      },
    },
  },
  adapter: cloudflare(),
  env: {
    schema: {
      // Supabase configuration
      SUPABASE_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      // OpenRouter API configuration
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      // Development/testing flags
      USE_MOCK_AI: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: false,
      }),
    },
  },
});