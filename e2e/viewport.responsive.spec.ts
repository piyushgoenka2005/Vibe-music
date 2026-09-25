import { test, expect } from "./fixtures";
import { fetchTrendingProduct } from "./helpers/test-utils";

const MOBILE = { width: 390, height: 844 };
const TABLET = { width: 834, height: 1112 };
const SMALL_PHONE = { width: 320, height: 568 };

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page, label: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow, label).toBeLessThanOrEqual(2);
}

const STOREFRONT_PATHS = [
  "/",
  "/cart",
  "/checkout",
  "/search",
  "/compare",
  "/deals",
  "/contact",
  "/track-order",
  "/category/guitars",
  "/brands",
  "/blog",
  "/rentals",
  "/giveaway",
  "/used",
  "/login",
  "/register",
  "/account",
];

const TABLET_PATHS = [
  "/",
  "/cart",
  "/search",
  "/checkout",
  "/deals",
  "/brands",
  "/blog",
  "/rentals",
];

test.describe("viewport responsive smoke", () => {
  test("storefront routes render without horizontal overflow (mobile 390px)", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(MOBILE);
    for (const path of STOREFRONT_PATHS) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.locator("body")).toBeVisible();
      await assertNoHorizontalOverflow(page, path);
    }
  });

  test("PDP renders without horizontal overflow (mobile 320–390px)", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchTrendingProduct(request);
    for (const viewport of [SMALL_PHONE, MOBILE]) {
      await page.setViewportSize(viewport);
      await page.goto(`/product/${product.slug}`, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 20_000,
      });
      await assertNoHorizontalOverflow(page, `pdp@${viewport.width}`);
    }
  });

  test("storefront routes render without horizontal overflow (tablet 834px)", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(TABLET);
    for (const path of TABLET_PATHS) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await assertNoHorizontalOverflow(page, path);
    }
  });

  test("storefront routes render without horizontal overflow (small phone 320px)", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(SMALL_PHONE);
    for (const path of STOREFRONT_PATHS) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.locator("body")).toBeVisible();
      await assertNoHorizontalOverflow(page, `${path}@320`);
    }
  });

  test("search overlay opens on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Open search" }).click();
    const overlayInput = page.locator("#sw-search-input-mobile, .sw-search-panel__input").first();
    await expect(overlayInput).toBeVisible({ timeout: 10_000 });
    await overlayInput.fill("guitar");
    await page.waitForTimeout(500);
    await assertNoHorizontalOverflow(page, "search overlay");

    await page.goto("/search", { waitUntil: "domcontentloaded" });
    const landingInput = page.locator("#sw-search-landing-input");
    await expect(landingInput).toBeVisible({ timeout: 10_000 });
    await landingInput.fill("drums");
    await page.waitForTimeout(500);
    await assertNoHorizontalOverflow(page, "search landing");
  });

  test("help widget opens on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const trigger = page.getByRole("button", { name: /help|support|need help/i }).first();
    if (await trigger.isVisible()) {
      await trigger.click();
      await expect(page.locator(".help-widget--open, .help-widget__panel").first()).toBeVisible({
        timeout: 10_000,
      });
      await assertNoHorizontalOverflow(page, "help widget");
    }
  });

  test("checkout capabilities exposes live Razorpay on production-like config", async ({
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const response = await request.get("/api/checkout/capabilities");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      razorpayConfigured?: boolean;
      razorpayMode?: string;
      onlinePaymentsAvailable?: boolean;
      demoPaymentsAllowed?: boolean;
    };
    if (body.razorpayConfigured) {
      expect(body.onlinePaymentsAvailable).toBe(true);
      expect(body.demoPaymentsAllowed).not.toBe(true);
    }
  });

  test("admin login is usable at mobile viewport", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Admin Login/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
