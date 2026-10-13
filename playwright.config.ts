import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./e2e/helpers/e2e-credentials";
import { loadLocalEnv } from "./e2e/load-env";

loadLocalEnv();

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isCI = Boolean(process.env.CI);
const skipNonChromium = process.env.E2E_SKIP_NON_CHROMIUM === "true";

/**
 * Authenticated / setup specs require their dedicated setup projects and the
 * seeded storage states; they only ever run on Chromium.
 */
const AUTH_SETUP_FILES = [
  /admin\.setup\.ts/,
  /customers\.setup\.ts/,
  /admin\.(authenticated|crud-smoke|security)\.spec\.ts/,
  /admin-features\.authenticated\.spec\.ts/,
  /admin-product-edit\.authenticated\.spec\.ts/,
  /(idor|account)\.authenticated\.spec\.ts/,
  /coupons\.(spec|authenticated\.spec)\.ts/,
  /mobile\.spec\.ts/,
];

/**
 * Cross-browser (Firefox / WebKit) runs the rendering- and DOM-focused specs
 * on every engine. Heavier authenticated/checkout flows stay on Chromium to
 * keep CI time and flake risk bounded.
 */
const CROSS_BROWSER_FILES = [
  /smoke\.spec\.ts/,
  /blog\.spec\.ts/,
  /edge-cases\.spec\.ts/,
  /programs\.spec\.ts/,
  /accessibility\.spec\.ts/,
  /product-image-framing\.spec\.ts/,
];

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI
    ? Math.min(4, Number(process.env.PLAYWRIGHT_WORKERS ?? 3))
    : Math.min(4, Number(process.env.PLAYWRIGHT_WORKERS ?? 2)),
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["junit", { outputFile: "playwright-report/junit.xml" }],
    ...(isCI ? [["blob", { outputFile: "blob-report/e2e.zip" }] as const] : []),
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
      name: "customers-setup",
      testMatch: /customers\.setup\.ts/,
    },
    {
      name: "chromium",
      testIgnore: AUTH_SETUP_FILES,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "idor-authenticated",
      testMatch: /(idor|account)\.authenticated\.spec\.ts/,
      dependencies: ["customers-setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin-authenticated",
      testMatch: [
        /admin\.(authenticated|crud-smoke|security)\.spec\.ts/,
        /admin-features\.authenticated\.spec\.ts/,
        /admin-product-edit\.authenticated\.spec\.ts/,
        /coupons\.(spec|authenticated\.spec)\.ts/,
      ],
      dependencies: ["admin-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
    },
    ...(!skipNonChromium
      ? [
          {
            name: "firefox",
            testMatch: CROSS_BROWSER_FILES,
            testIgnore: AUTH_SETUP_FILES,
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "webkit",
            testMatch: CROSS_BROWSER_FILES,
            testIgnore: AUTH_SETUP_FILES,
            use: { ...devices["Desktop Safari"] },
          },
        ]
      : []),
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        // Default (Turbopack) dev server — boots fast and is the app's own
        // `npm run dev` path. `--webpack` currently fails to compile server
        // deps (see serverExternalPackages in next.config.ts).
        command: "npx next dev",
        url: baseURL,
        reuseExistingServer: !isCI || Boolean(process.env.PLAYWRIGHT_REUSE_SERVER),
        timeout: 180_000,
        env: {
          ...process.env,
          NODE_OPTIONS: "",
          NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH: "false",
          NEXT_PUBLIC_ENABLE_SPLASH_CURSOR: "false",
          DISABLE_RATE_LIMIT: "true",
          E2E_TEST_MODE: "true",
          E2E_ADMIN_EMAIL,
          E2E_ADMIN_PASSWORD,
        },
      },
});
