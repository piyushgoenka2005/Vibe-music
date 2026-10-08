import { test, expect } from "./fixtures";
import { E2E_USER_A_STORAGE_PATH } from "./helpers/customer-auth";

test.describe("authenticated account", () => {
  test.use({ storageState: E2E_USER_A_STORAGE_PATH });

  test("referral card loads with shareable code", async ({ page, requiresDatabase }) => {
    void requiresDatabase;
    await page.goto("/account", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /refer a friend/i })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.locator(".acct__referral-code")).toHaveText(/[A-Z0-9_-]{4,}/, {
      timeout: 25_000,
    });
    await expect(page.locator("#acct-referral-share-url")).toHaveValue(/vibemusic\.in|localhost/i);
  });
});
