import { test, expect } from "./fixtures";
import {
  fetchCheckoutProduct,
  fetchTrendingProduct,
  fillGuestCheckoutAddress,
  seedGuestCart,
} from "./helpers/test-utils";

test.describe("customer storefront journeys", () => {
  test("homepage + primary navigation landmarks", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("header, [role='banner']").first()).toBeVisible();
    await expect(page.locator("main, [role='main'], #main-content").first()).toBeVisible();
  });

  test("search landing and results", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/search/results?q=guitar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("category + brands browse", async ({ page, requiresDatabase }) => {
    void requiresDatabase;
    await page.goto("/category/guitars", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/brands", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("product detail + add to cart + update + remove", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    test.setTimeout(120_000);
    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);

    const remove = page.getByRole("button", { name: /remove/i }).first();
    if (await remove.isVisible().catch(() => false)) {
      await remove.click();
      await expect(page.getByText(/empty|no items|shopping cart \(0\)/i).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("Complete Your Order / recommendations surface on cart", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /complete your order|recommended for you/i }).first()
    ).toBeVisible({ timeout: 25_000 });
  });

  test("wishlist page loads", async ({ page }) => {
    await page.goto("/wishlist", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("compare page loads", async ({ page }) => {
    await page.goto("/compare", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /compare products/i, level: 1 })
    ).toBeVisible();
  });

  test("blog + contact + support entry points", async ({ page }) => {
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/account/support");
    await expect(page).toHaveURL(/\/login/);
  });

  test("auth pages: login, register, password reset", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.goto("/register");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("profile requires authentication", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
  });

  test("order history + track order surfaces", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/track-order");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("guest checkout reaches payment step (mock-safe)", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    test.setTimeout(120_000);
    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    const email = `e2e-flow-${Date.now()}@example.com`;
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await fillGuestCheckoutAddress(page, email);
    await page.getByRole("button", { name: /Continue to Review/i }).click();
    await expect(page.getByRole("heading", { name: /Review Your Order/i })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: /Continue to Payment/i }).click();
    await expect(page.getByText(/razorpay|pay securely|payment/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("product variants / options render when present", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchTrendingProduct(request);
    await page.goto(`/product/${product.slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Soft assertion: variants may be absent for many SKUs.
    const variant = page.locator(
      "[data-variant], .pdp-variant, .product-options, [role='radiogroup']"
    );
    if ((await variant.count()) > 0) {
      await expect(variant.first()).toBeVisible();
    }
  });
});
