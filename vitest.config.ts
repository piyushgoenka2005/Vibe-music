import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit/integration test config — aligned with VIBE_QA_TEST_REPORT.md (525 tests, 95 files).
 * Run: npm test · Coverage gates enforced when using `vitest run --coverage`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      // Minimum coverage gates for CI / release sign-off (see VIBE_CLIENT_ACCEPTANCE_SCORECARD.md)
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
