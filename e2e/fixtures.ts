import { test as base, expect } from "@playwright/test";
import { isDatabaseHealthy } from "./helpers/test-utils";

type Fixtures = {
  /** Skips the test when /api/health reports Postgres unavailable. */
  requiresDatabase: void;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("vibe-splash-seen", "1");
      } catch {
        /* ignore */
      }
    });
    await use(page);
  },
  requiresDatabase: [
    async ({ request }, use, testInfo) => {
      const healthy = await isDatabaseHealthy(request);
      if (!healthy) {
        testInfo.skip(true, "DATABASE_URL / Postgres required");
      }
      await use();
    },
    { auto: false },
  ],
});

export { expect };
