import { test, expect } from "./fixtures";
import fs from "node:fs";
import {
  createProductScopedCoupon,
  deleteCouponById,
  productPageUrl,
  resolveProductUrl,
  uniqueCouponCode,
} from "./helpers/coupon-e2e";
import { E2E_ADMIN_SEED_MARKER } from "./helpers/e2e-paths";
import { e2eMutationHeaders } from "./helpers/e2e-origin";
import { fetchCheckoutProduct } from "./helpers/test-utils";

const adminReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(E2E_ADMIN_SEED_MARKER);

test.describe("product-dedicated coupons (admin workflow)", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");

  test("admin creates coupon via product URL paste flow", async ({ page, request }) => {
    test.slow();
    test.setTimeout(120_000);

    const product = await fetchCheckoutProduct(request);
    const code = uniqueCouponCode("URL");
    let couponId: string | null = null;

    try {
      const resolved = await resolveProductUrl(request, productPageUrl(product.slug));
      expect(resolved.productIds).toContain(product.id);

      await page.goto("/admin/coupons", { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: /product ad coupon/i }).click();

      await page.locator("textarea.admin-input").fill(productPageUrl(product.slug));
      await page.getByRole("button", { name: /add from urls/i }).click();

      await expect(page.getByText(product.name).first()).toBeVisible({ timeout: 20_000 });

      await page.getByLabel(/^code$/i).fill(code);
      await page.getByLabel(/^label$/i).fill(`E2E URL coupon ${code}`);
      await page.getByRole("button", { name: /^10% off$/i }).click();
      await page.getByRole("button", { name: /^save$/i }).click();

      await expect(page.getByText(code).first()).toBeVisible({ timeout: 20_000 });

      const listRes = await request.get("/api/admin/coupons?limit=20");
      expect(listRes.ok()).toBeTruthy();
      const listBody = (await listRes.json()) as {
        coupons?: Array<{ id: string; code: string }>;
      };
      const created = listBody.coupons?.find((entry) => entry.code === code);
      expect(created?.id).toBeTruthy();
      couponId = created!.id;
    } finally {
      if (couponId) {
        await deleteCouponById(request, couponId);
      }
    }
  });

  test("admin API binds same coupon to two products via resolve-products", async ({ request }) => {
    test.slow();

    const productA = await fetchCheckoutProduct(request);
    const listRes = await request.get("/api/products?limit=40");
    expect(listRes.ok()).toBeTruthy();
    const listBody = (await listRes.json()) as {
      products?: Array<{ id: string; slug: string }>;
    };
    const productB = (listBody.products ?? []).find((entry) => entry.id !== productA.id);
    test.skip(!productB, "Need two catalog products");

    const resolved = await resolveProductUrl(
      request,
      `${productPageUrl(productA.slug)}\n${productPageUrl(productB.slug)}`,
    );
    expect(resolved.productIds).toEqual(expect.arrayContaining([productA.id, productB.id]));

    const coupon = await createProductScopedCoupon(request, productA, {
      code: uniqueCouponCode("MUL"),
    });

    try {
      const patchRes = await request.put(`/api/admin/coupons/${coupon.id}`, {
        headers: e2eMutationHeaders(),
        data: {
          productIds: resolved.productIds,
          scope: "products",
        },
      });
      expect(patchRes.ok()).toBeTruthy();
    } finally {
      await deleteCouponById(request, coupon.id);
    }
  });
});
