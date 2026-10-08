import { defineConfig } from "vitest/config";
import path from "node:path";

const root = path.resolve(__dirname, "..");

/** Postgres-backed integration tests — run after `npm run db:migrate`. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 30_000,
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
