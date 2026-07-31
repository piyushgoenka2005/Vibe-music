import { defineConfig, devices } from "@playwright/test";
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from "./e2e/helpers/e2e-credentials";
import { loadLocalEnv } from "./e2e/load-env";

loadLocalEnv();

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: isCI ? 1 : Math.min(4, Number(process.env.PLAYWRIGHT_WORKERS ?? 2)),
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["junit", { outputFile: "playwright-report/junit.xml" }],
  ],
  use: {
    baseURL,
    trace: isCI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: isCI ? "retain-on-failure" : "off",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "admin-setup",
      testMatch: /admin\.setup\.ts/,
    },
    {
      name: "chromium",
      testIgnore: [
        /admin\.setup\.ts/,
        /admin\.(authenticated|crud-smoke|security)\.spec\.ts/,
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin-authenticated",
      testMatch: /admin\.(authenticated|crud-smoke|security)\.spec\.ts/,
      dependencies: ["admin-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        // Webpack avoids intermittent Turbopack panics that abort the E2E webServer.
        command: "npx next dev --webpack",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        env: {
          ...process.env,
          NODE_OPTIONS: "",
          NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH: "false",
          DISABLE_RATE_LIMIT: "true",
          E2E_ADMIN_EMAIL,
          E2E_ADMIN_PASSWORD,
        },
      },
});
