import { defineConfig, devices } from "@playwright/test";
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from "./e2e/helpers/e2e-credentials";
import { loadLocalEnv } from "./e2e/load-env";

loadLocalEnv();

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  reporter: process.env.CI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
        ["json", { outputFile: "playwright-report/results.json" }],
      ]
    : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "admin-setup",
      testMatch: /admin\.setup\.ts/,
    },
    {
      name: "chromium",
      testIgnore: [/admin\.setup\.ts/, /admin\.authenticated\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin-authenticated",
      testMatch: /admin\.authenticated\.spec\.ts/,
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
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH: "false",
          DISABLE_RATE_LIMIT: "true",
          E2E_ADMIN_EMAIL,
          E2E_ADMIN_PASSWORD,
        },
      },
});
