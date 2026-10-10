import { test, expect } from "./fixtures";
import { E2E_USER_A_STORAGE_PATH } from "./helpers/customer-auth";

test.describe("authenticated account dashboard", () => {
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

  test("sidebar reaches every account section", async ({ page, requiresDatabase }) => {
    void requiresDatabase;
    test.setTimeout(180_000);
    test.slow();

    const routes: Array<{ path: string; heading: RegExp }> = [
      { path: "/account", heading: /dashboard|refer a friend/i },
      { path: "/account/orders", heading: /^orders$/i },
      { path: "/account/wishlist", heading: /^wishlist$/i },
      { path: "/account/rentals", heading: /my rentals/i },
      { path: "/account/giveaways", heading: /my giveaways/i },
      { path: "/account/profile", heading: /^profile$/i },
      { path: "/account/addresses", heading: /^addresses$/i },
      { path: "/account/notifications", heading: /^notifications$/i },
      { path: "/account/support", heading: /support tickets/i },
      { path: "/account/settings", heading: /^settings$/i },
    ];

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, "\\/")), {
        timeout: 30_000,
      });
      await expect(page.locator(".acct__sidebar, .acct__mobile-nav").first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
        timeout: 30_000,
      });
    }
  });

  test("account APIs respond for session user", async ({ request, requiresDatabase }) => {
    void requiresDatabase;
    const profile = await request.get("/api/account/profile");
    expect(profile.status()).toBe(200);

    const wishlist = await request.get("/api/account/wishlist");
    expect(wishlist.status()).toBe(200);

    const referral = await request.get("/api/account/referral-coupon");
    expect(referral.status()).toBe(200);

    const notifications = await request.get("/api/account/notifications");
    expect(notifications.status()).toBe(200);
  });
});
