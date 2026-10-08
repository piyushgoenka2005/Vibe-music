import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import type { E2EProduct } from "./test-utils";
import { E2E_ORIGIN, mutationHeaders } from "./test-utils";

export interface E2ECoupon {
  id: string;
  code: string;
}

export function uniqueCouponCode(prefix = "E2E"): string {
  return `${prefix}${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

export async function createProductScopedCoupon(
  request: APIRequestContext,
  product: E2EProduct,
  options?: {
    code?: string;
    type?: "percentage" | "flat" | "free_shipping";
    value?: number;
  },
): Promise<E2ECoupon> {
  const code = options?.code ?? uniqueCouponCode();
  const type = options?.type ?? "percentage";
  const value = type === "free_shipping" ? 0 : (options?.value ?? 10);

  const response = await request.post("/api/admin/coupons", {
    headers: mutationHeaders(),
    data: {
      code,
      label: `E2E ${type} on ${product.name}`,
      type,
      value,
      scope: "products",
      productIds: [product.id],
      isActive: true,
      utmSource: "e2e",
      utmMedium: "test",
    },
  });

  expect(
    response.ok(),
    `create coupon failed: ${response.status()} ${await response.text()}`,
  ).toBeTruthy();
  const body = (await response.json()) as { coupon: E2ECoupon };
  expect(body.coupon?.code).toBe(code);
  return body.coupon;
}

export async function deleteCouponById(
  request: APIRequestContext,
  couponId: string,
): Promise<void> {
  const response = await request.delete(`/api/admin/coupons/${couponId}`, {
    headers: mutationHeaders(),
  });
  expect(response.ok(), `delete coupon failed: ${response.status()}`).toBeTruthy();
}

export async function validateCouponApi(
  request: APIRequestContext,
  input: {
    code: string;
    subtotal: number;
    items?: Array<{ productId: string; quantity: number; price: number }>;
    customerEmail?: string;
  },
): Promise<{ status: number; result: { valid: boolean; discount?: number; error?: string } }> {
  const response = await request.post("/api/coupons/validate", {
    headers: mutationHeaders(),
    data: input,
  });
  const body = (await response.json()) as {
    result?: { valid: boolean; discount?: number; error?: string };
  };
  return {
    status: response.status(),
    result: body.result ?? { valid: false, error: "missing result" },
  };
}

export async function fetchActiveCouponsForProduct(
  request: APIRequestContext,
  productId: string,
): Promise<Array<{ code: string }>> {
  const response = await request.get(
    `/api/coupons/active?productId=${encodeURIComponent(productId)}`,
  );
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { coupons?: Array<{ code: string }> };
  return body.coupons ?? [];
}

export async function resolveProductUrl(
  request: APIRequestContext,
  productUrls: string | string[],
): Promise<{ productIds: string[] }> {
  const urls = (Array.isArray(productUrls) ? productUrls : productUrls.split(/[\n,]+/))
    .map((entry) => entry.trim())
    .filter(Boolean);
  const response = await request.post("/api/admin/coupons/resolve-products", {
    headers: mutationHeaders(),
    data: { urls },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { productIds: string[] };
}

export function productPageUrl(slug: string): string {
  return `${E2E_ORIGIN}/product/${slug}`;
}
