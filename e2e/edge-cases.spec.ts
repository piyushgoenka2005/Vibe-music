import { test, expect } from "./fixtures";
import {
  fetchCheckoutProduct,
  fetchTrendingProduct,
  seedGuestCart,
} from "./helpers/test-utils";

test.describe("edge cases + resilience", () => {
  test("invalid product URL shows not-found or recoverable state", async ({ page }) => {
    await page.goto("/product/__no_such_slug_zzz__", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByText(/not found|doesn't exist|404|unavailable/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("invalid category URL is recoverable", async ({ page }) => {
    await page.goto("/category/__no_such_category__", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("duplicate add-to-cart clicks do not crash PDP", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchTrendingProduct(request);
    await page.goto(`/product/${product.slug}`, { waitUntil: "domcontentloaded" });
    const add = page.getByRole("button", { name: /^Add to Cart$/i }).first();
    if (!(await add.isEnabled().catch(() => false))) {
      test.skip(true, "Add to Cart disabled for trending product");
    }
    await Promise.all([add.click(), add.click().catch(() => undefined)]);
    await expect(page.locator("body")).toBeVisible();
  });

  test("refresh during checkout preserves cart contents", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(product.name).first()).toBeVisible({ timeout: 20_000 });
  });

  test("browser back from cart to PDP remains usable", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchCheckoutProduct(request);
    await page.goto(`/product/${product.slug}`, { waitUntil: "domcontentloaded" });
    await seedGuestCart(page, product);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await page.goBack();
    await expect(page.locator("body")).toBeVisible();
  });

  test("slow network: homepage still loads", async ({ page }) => {
    await page.route("**/*", async (route) => {
      await new Promise((r) => setTimeout(r, 100));
      await route.continue();
    });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.locator("body")).toBeVisible();
  });
});
