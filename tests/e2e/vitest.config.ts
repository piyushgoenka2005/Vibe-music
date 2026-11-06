import { defineConfig } from "vitest/config";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/e2e/**/*.{test,spec}.ts", "tests/e2e/**/*.{test,spec}.tsx"],
    exclude: ["**/sanity.test.ts"],
    setupFiles: [path.resolve(__dirname, "./setup.ts")],
    testTimeout: 20_000,
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
      {
        find: "next/server",
        replacement: path.resolve(root, "./node_modules/next/server.js"),
      },
    ],
  },
});
