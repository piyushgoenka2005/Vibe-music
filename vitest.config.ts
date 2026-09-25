import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit/integration test config for src test files.
 * Run: npm test · Coverage gates enforced when using `vitest run --coverage`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      // Minimum coverage gates for CI / release sign-off
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 65,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/test/mocks/server-only.ts"),
    },
  },
});
