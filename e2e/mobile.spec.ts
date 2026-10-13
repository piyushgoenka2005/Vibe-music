import { test, expect } from "./fixtures";
import {
  fetchTrendingProduct,
  openMobileMenu,
  searchAndAwaitSuggestions,
} from "./helpers/test-utils";

/**
 * Mobile-device emulation (Pixel 7) coverage. Runs under the
 * `mobile-chromium` project only — these tests assume a mobile viewport and
 * touch context, so they must not run on desktop Chromium.
 */

const MOBILE_PATHS = ["/", "/cart", "/search", "/compare", "/contact", "/track-order", "/login"];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page, label: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow, label).toBeLessThanOrEqual(2);
}

test.describe("mobile storefront", () => {
  test("key storefront pages render without horizontal overflow", async ({ page }) => {
    test.setTimeout(120_000);
    for (const path of MOBILE_PATHS) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.locator("body")).toBeVisible();
      await assertNoHorizontalOverflow(page, path);
    }
  });

  test("mobile menu opens, exposes category links, and closes", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const drawer = await openMobileMenu(page);
    await expect(drawer.locator('a[href^="/category/"]').first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Close menu" }).first().click();
    await expect(drawer).toBeHidden({ timeout: 10_000 });
  });

  test("mobile menu navigates to a category listing", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const drawer = await openMobileMenu(page);

    const categoryLink = drawer.locator('a[href^="/category/"]').first();
    await categoryLink.click();
    await expect(page).toHaveURL(/\/category\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 20_000,
    });
    void request;
  });

  test("mobile search overlay opens without horizontal overflow", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await searchAndAwaitSuggestions(page, "guitar");
    await page.waitForTimeout(500);
    await assertNoHorizontalOverflow(page, "search overlay");
  });

  test("product detail renders touch-friendly purchase actions", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchTrendingProduct(request);
    await page.goto(`/product/${product.slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 20_000,
    });
    await assertNoHorizontalOverflow(page, "pdp@mobile");
    const addToCart = page.getByRole("button", { name: /^Add to Cart$/i }).first();
    if (await addToCart.count()) {
      await expect(addToCart).toBeVisible();
    }
  });
});
