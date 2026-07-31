import { test, expect } from "./fixtures";
import {
  fetchCheckoutProduct,
  fetchTrendingProduct,
  fillGuestCheckoutAddress,
  guestShippingAddress,
  mutationHeaders,
  seedGuestCart,
  waitForCheckoutAddressForm,
} from "./helpers/test-utils";

test.describe("catalog browse", () => {
  test("search results page loads", async ({ page }) => {
    await page.goto("/search/results?q=guitar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("deals page loads", async ({ page, requiresDatabase }) => {
    void requiresDatabase;
    await page.goto("/deals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("brands page loads", async ({ page, requiresDatabase }) => {
    void requiresDatabase;
    await page.goto("/brands", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("product detail page loads from API slug", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchTrendingProduct(request);
    await page.goto(`/product/${product.slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("category page loads", async ({ page }) => {
    await page.goto("/category/guitars", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("cart and wishlist", () => {
  test("cart shows seeded product", async ({ page, request, requiresDatabase }) => {
    void requiresDatabase;
    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(product.name).first()).toBeVisible({ timeout: 15_000 });
  });

  test("compare page accepts share API", async ({ request, requiresDatabase }) => {
    void requiresDatabase;
    const product = await fetchTrendingProduct(request);
    const response = await request.post("/api/compare/share", {
      headers: mutationHeaders(),
      data: {
        items: [
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.image ?? "",
            imageColor: product.imageColor ?? "#ccc",
          },
        ],
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.share?.url).toContain("/compare/share/");
  });
});

test.describe("guest checkout", () => {
  test("checkout shows Razorpay-only payment options", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;

    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    const email = `e2e-guest-${Date.now()}@example.com`;

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await waitForCheckoutAddressForm(page);
    await fillGuestCheckoutAddress(page, email);
    await page.getByRole("button", { name: /Continue to Review/i }).click();
    await expect(page.getByRole("heading", { name: /Review Your Order/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: /Continue to Payment/i }).click();

    const payMethods = page.locator(".checkout-pay-methods");
    await expect(payMethods).toBeVisible({ timeout: 15_000 });
    await expect(payMethods.getByRole("button", { name: /Pay Online/i })).toBeVisible();
    await expect(payMethods.getByText(/Cash on Delivery/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Place order \(COD\)/i })).toHaveCount(0);
  });

  test("create-order API rejects COD payment method", async ({ request }) => {
    test.slow();
    // Payment-method gate runs before item resolution — no catalog/DB required.
    const response = await request.post("/api/payment/create-order", {
      timeout: 30_000,
      headers: mutationHeaders(),
      data: {
        items: [
          {
            productId: "e2e-cod-rejected",
            name: "E2E COD Reject Fixture",
            quantity: 1,
            price: 1999,
            gstRate: 18,
          },
        ],
        email: `e2e-api-${Date.now()}@example.com`,
        paymentMethod: "cod",
        shippingAddress: guestShippingAddress,
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/razorpay/i);
  });
});
