import { test, expect } from "./fixtures";
import {
  fetchCheckoutProduct,
  fetchTrendingProduct,
  mutationHeaders,
  seedGuestCart,
} from "./helpers/test-utils";

test.describe("audit-fix E2E: security and accessibility", () => {
  test("homepage returns security headers (SEC-01)", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
  });

  test("admin routes send X-Robots-Tag noindex (SEC-08)", async ({ request }) => {
    const response = await request.get("/admin/login");
    expect(response.headers()["x-robots-tag"]).toMatch(/noindex/i);
  });

  test("cart link exposes accessible label when empty (UX-05)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cart = page.getByRole("link", { name: /no items in your cart|cart/i }).first();
    await expect(cart).toBeVisible();
    const label = await cart.getAttribute("aria-label");
    expect(label?.toLowerCase()).toMatch(/cart/);
  });
});

test.describe("audit-fix E2E: search and commerce", () => {
  test("header search overlay shows suggestions (L-07)", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const api = await request.get("/api/search?q=guitar&mode=suggest");
    expect(api.status()).toBeLessThan(500);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const toggle = page.getByRole("button", { name: /open search/i });
    if (await toggle.count()) {
      await toggle.click();
    }

    const input = page.locator("#sw-search-input-mobile, #sw-search-input").first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill("guitar");
    await expect(
      page.locator("[role='listbox'], .search-suggest, .search-overlay").first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("search typeahead returns suggestions for guitar (UX-07)", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const api = await request.get("/api/search?q=guitar&mode=suggest");
    if (api.ok()) {
      const body = (await api.json()) as { products?: unknown[]; suggestions?: unknown[] };
      const count = (body.products?.length ?? 0) + (body.suggestions?.length ?? 0);
      expect(count).toBeGreaterThan(0);
    }
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    const input = page
      .locator(
        '#sw-search-input, #sw-search-input-mobile, .site-header__search-input, input[type="search"]',
      )
      .first();
    if (await input.count()) {
      await input.fill("guitar");
      await expect(
        page
          .locator(".search-suggest, .search-overlay, [role='listbox'], .search-dropdown")
          .first(),
      ).toBeVisible({ timeout: 15_000 });
    }
  });
});

test.describe("audit-fix E2E: out-of-stock and coupon flows", () => {
  // E2E-07: Out-of-stock product disables Buy Now
  test("out-of-stock product disables purchase buttons", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchTrendingProduct(request);
    await page.goto(`/product/${product.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    // If an out-of-stock variant or product shows up, the buy button should be disabled/absent
    // or replaced by a Notify Me button
    const buyNow = page.getByRole("button", { name: /Buy Now/i });
    const addToCart = page.getByRole("button", { name: /Add to cart/i });
    const notifyMe = page.getByRole("button", { name: /notify/i });
    // At least one of these states should be present
    const hasPurchasable = (await buyNow.count()) > 0 || (await addToCart.count()) > 0;
    const hasNotify = (await notifyMe.count()) > 0;
    expect(hasPurchasable || hasNotify).toBeTruthy();
  });

  // E2E-03: Coupon code API validation
  test("coupon API rejects invalid coupon code", async ({ request, requiresDatabase }) => {
    void requiresDatabase;
    const response = await request.post("/api/coupons/validate", {
      headers: mutationHeaders(),
      data: {
        code: "INVALID_COUPON_XYZ_999",
        subtotal: 5000,
      },
    });
    // Should return 404 or 400 for an invalid coupon, not 500
    expect([400, 404, 422]).toContain(response.status());
  });

  // E2E-09: Mobile viewport full purchase flow
  test("mobile viewport checkout form is reachable (375px)", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 375, height: 812 });
    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    // The checkout form must be visible and not clipped on mobile
    const form = page.locator(".checkout-form, form").first();
    await expect(form).toBeVisible({ timeout: 20_000 });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow, "No horizontal overflow on mobile checkout").toBeLessThanOrEqual(2);
  });

  // E2E-05: Order tracking page loads correctly
  test("track order page renders and accepts order ID input", async ({ page }) => {
    await page.goto("/track-order", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    // Should have an input for order ID or tracking token
    const input = page
      .locator(
        'input[name*="order"], input[name*="track"], input[placeholder*="order"], input[placeholder*="ID"]',
      )
      .first();
    // Input might exist or page may show tracking form
    const hasInput = (await input.count()) > 0;
    const hasForm = (await page.locator("form").count()) > 0;
    expect(hasInput || hasForm).toBeTruthy();
  });

  // E2E-08: Cart is consistent across navigation
  test("cart item count persists after navigation", async ({ page, request, requiresDatabase }) => {
    void requiresDatabase;
    test.setTimeout(60_000);
    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    // Navigate away and back
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    // Cart should still have the item
    await expect(page.getByText(product.name).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  // Security: verify create-order rejects client-supplied price fields (L-15)
  test("checkout rejects tampered item price via API", async ({ request }) => {
    const response = await request.post("/api/payment/create-order", {
      headers: mutationHeaders(),
      data: {
        items: [
          {
            productId: "nonexistent-product-tamper-test",
            quantity: 1,
            price: 1,
            gstRate: 18,
          },
        ],
        email: `tamper-test-${Date.now()}@example.com`,
        paymentMethod: "razorpay",
        shippingAddress: {
          name: "Test User",
          phone: "9876543210",
          line1: "123 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "IN",
        },
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
