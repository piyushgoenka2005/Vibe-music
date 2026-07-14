import { test as base, expect } from "@playwright/test";

export const test = base.extend({
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
});

export { expect };
