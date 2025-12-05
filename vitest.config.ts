import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment configuration
    environment: "jsdom",

    // Setup files
    setupFiles: ["./tests/setup/test-setup.ts"],

    // Global test settings
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "dist/", "**/*.config.ts", "**/*.config.js", "**/*.d.ts", "tests/", ".astro/"],
      // Thresholds for critical code paths
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Include test files (only .test.ts files, not .spec.ts which are for E2E)
    include: ["**/*.test.{ts,tsx}"],

    // Exclude patterns
    exclude: [
      "node_modules",
      "dist",
      ".astro",
      "build",
      "**/*.spec.ts", // E2E tests are handled by Playwright
      "tests/e2e/**", // Exclude E2E directory
    ],

    // Test timeout
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/types": path.resolve(__dirname, "./src/types.ts"),
      "@/db": path.resolve(__dirname, "./src/db"),
    },
  },
});
