import { test, expect } from "./fixtures";
import fs from "node:fs";
import {
  createProductScopedCoupon,
  deleteCouponById,
  fetchActiveCouponsForProduct,
  uniqueCouponCode,
  validateCouponApi,
} from "./helpers/coupon-e2e";
import { E2E_ADMIN_SEED_MARKER } from "./helpers/e2e-paths";
import {
  fetchCheckoutProduct,
  fetchTrendingProduct,
  mutationHeaders,
  seedGuestCart,
} from "./helpers/test-utils";

const adminReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(E2E_ADMIN_SEED_MARKER);

test.describe("product-dedicated coupons (API)", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");
  test("rejects coupon when cart has no eligible products", async ({
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const productA = await fetchCheckoutProduct(request);
    const productB = await fetchTrendingProduct(request);
    test.skip(productA.id === productB.id, "Need two distinct catalog products");

    const coupon = await createProductScopedCoupon(request, productA, {
      code: uniqueCouponCode("ISO"),
      value: 15,
    });

    try {
      const wrong = await validateCouponApi(request, {
        code: coupon.code,
        subtotal: productB.price,
        items: [{ productId: productB.id, quantity: 1, price: productB.price }],
      });
      expect(wrong.status).toBe(400);
      expect(wrong.result.valid).toBe(false);
      expect(wrong.result.error).toMatch(/does not apply/i);

      const right = await validateCouponApi(request, {
        code: coupon.code,
        subtotal: productA.price,
        items: [{ productId: productA.id, quantity: 1, price: productA.price }],
      });
      expect(right.status).toBe(200);
      expect(right.result.valid).toBe(true);
      expect(right.result.discount).toBeGreaterThan(0);
    } finally {
      await deleteCouponById(request, coupon.id);
    }
  });

  test("active coupons API returns only product-scoped offers for PDP", async ({
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchCheckoutProduct(request);
    const coupon = await createProductScopedCoupon(request, product, {
      code: uniqueCouponCode("PDP"),
    });

    try {
      const offers = await fetchActiveCouponsForProduct(request, product.id);
      expect(offers.some((entry) => entry.code === coupon.code)).toBe(true);
    } finally {
      await deleteCouponById(request, coupon.id);
    }
  });

  test("free shipping coupon validates with zero line discount", async ({
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const product = await fetchCheckoutProduct(request);
    const coupon = await createProductScopedCoupon(request, product, {
      code: uniqueCouponCode("SHIP"),
      type: "free_shipping",
    });

    try {
      const result = await validateCouponApi(request, {
        code: coupon.code,
        subtotal: product.price,
        items: [{ productId: product.id, quantity: 1, price: product.price }],
      });
      expect(result.status).toBe(200);
      expect(result.result.valid).toBe(true);
      expect(result.result.discount).toBe(0);
    } finally {
      await deleteCouponById(request, coupon.id);
    }
  });

  test("invalid coupon code returns client error not server error", async ({
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    const response = await request.post("/api/coupons/validate", {
      headers: mutationHeaders(),
      data: {
        code: "NOT_A_REAL_COUPON_E2E",
        subtotal: 1000,
        items: [],
      },
    });
    expect([400, 404, 422]).toContain(response.status());
  });
});

test.describe("product-dedicated coupons (storefront UI)", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");

  test("checkout shows applicable offer and applies product coupon", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    test.slow();

    const product = await fetchCheckoutProduct(request);
    const coupon = await createProductScopedCoupon(request, product, {
      code: uniqueCouponCode("CHK"),
      value: 10,
    });

    try {
      await seedGuestCart(page, product);
      await page.goto("/checkout", { waitUntil: "domcontentloaded" });

      const offerButton = page.getByRole("button", { name: new RegExp(coupon.code, "i") });
      await expect(offerButton).toBeVisible({ timeout: 20_000 });
      await offerButton.click();

      await expect(page.locator(".checkout-summary").getByText(coupon.code)).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteCouponById(request, coupon.id);
    }
  });

  test("PDP shows promo banner when product coupon is active", async ({
    page,
    request,
    requiresDatabase,
  }) => {
    void requiresDatabase;
    test.slow();

    const product = await fetchCheckoutProduct(request);
    const coupon = await createProductScopedCoupon(request, product, {
      code: uniqueCouponCode("BAN"),
      value: 12,
    });

    try {
      await page.goto(`/product/${product.slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".pdp-coupon-promo")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(new RegExp(coupon.code))).toBeVisible();
      await page.getByRole("button", { name: /use offer/i }).click();
    } finally {
      await deleteCouponById(request, coupon.id);
    }
  });
});
