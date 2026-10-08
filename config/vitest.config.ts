import { defineConfig } from "vitest/config";
import path from "node:path";

const root = path.resolve(__dirname, "..");

/**
 * Unit test config for src test files.
 * Run: npm test
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 65,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@\/components\/homepage\/(.*)/,
        replacement: `${path.resolve(root, "./src/components/storefront/sections")}/$1`,
      },
      { find: "@", replacement: path.resolve(root, "./src") },
      {
        find: "server-only",
        replacement: path.resolve(root, "./src/test/mocks/server-only.ts"),
      },
    ],
  },
});
