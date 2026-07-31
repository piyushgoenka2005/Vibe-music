import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export interface E2EProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image?: string;
  imageColor?: string;
  categorySlug?: string;
  gstRate?: number;
  stock?: number;
  availability?: string;
}

export const E2E_ORIGIN =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export async function gotoStorefront(
  page: Page,
  path: string,
  options?: {
    timeout?: number;
    waitUntil?: "domcontentloaded" | "load" | "networkidle";
  }
): Promise<void> {
  const timeout = options?.timeout ?? 60_000;
  const waitUntil = options?.waitUntil ?? "domcontentloaded";
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(path, { waitUntil, timeout });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
  throw lastError;
}

async function seedGuestCartViaStorage(
  page: Page,
  product: E2EProduct
): Promise<void> {
  await gotoStorefront(page, "/");
  await page.evaluate((p) => {
    const item = {
      lineId: p.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: p.price,
      gstRate: p.gstRate ?? 18,
      imageColor: p.imageColor ?? "#cccccc",
      image: p.image ?? "",
      quantity: 1,
    };
    localStorage.setItem(
      "vibe-cart-guest",
      JSON.stringify({
        state: { items: [item], couponCode: null, appliedCoupon: null },
        version: 5,
      })
    );
  }, product);
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function trySeedGuestCartViaUi(
  page: Page,
  product: E2EProduct
): Promise<boolean> {
  await gotoStorefront(page, `/product/${product.slug}`);

  const addToCart = page.getByRole("button", { name: /^Add to Cart$/i }).first();
  const visible = await addToCart.isVisible({ timeout: 10_000 }).catch(() => false);
  if (!visible) return false;

  const enabled = await addToCart.isEnabled().catch(() => false);
  if (!enabled) return false;

  try {
    await addToCart.click({ timeout: 5_000 });
    await expect(
      page.getByRole("link", { name: /item.*in your cart/i })
    ).toBeVisible({ timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Seeds a guest cart reliably for checkout E2E.
 * Defaults to localStorage (immune to PDP stock / disabled Add to Cart).
 * Set E2E_CART_VIA_UI=true to prefer the UI path with storage fallback.
 */
export async function seedGuestCart(page: Page, product: E2EProduct): Promise<void> {
  if (process.env.E2E_CART_VIA_UI === "true") {
    const addedViaUi = await trySeedGuestCartViaUi(page, product);
    if (addedViaUi) return;
  }

  await seedGuestCartViaStorage(page, product);
  await gotoStorefront(page, "/cart");
  await expect(page.getByText(product.name).first()).toBeVisible({
    timeout: 15_000,
  });
}

export async function fetchTrendingProduct(
  request: APIRequestContext
): Promise<E2EProduct> {
  const response = await request.get("/api/products?trending=true&limit=1");
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { products?: E2EProduct[] };
  const product = body.products?.[0];
  expect(product?.id).toBeTruthy();
  return product!;
}

function isPurchasableProduct(product: E2EProduct): boolean {
  if (product.price <= 0) return false;
  if (product.availability === "out-of-stock") return false;
  if (typeof product.stock === "number" && product.stock <= 0) return false;
  return true;
}

/** Prefer in-stock products so API checkout paths stay valid after prior test orders. */
export async function fetchCheckoutProduct(
  request: APIRequestContext
): Promise<E2EProduct> {
  const response = await request.get("/api/products?limit=40");
  if (response.ok()) {
    const body = (await response.json()) as { products?: E2EProduct[] };
    const purchasable = (body.products ?? []).filter(isPurchasableProduct);
    if (purchasable.length > 0) {
      return purchasable[0]!;
    }
  }
  return fetchTrendingProduct(request);
}

export async function waitForCheckoutAddressForm(page: Page): Promise<void> {
  await expect(page.locator(".checkout-form")).toBeVisible({ timeout: 20_000 });
}

export async function fillGuestCheckoutAddress(
  page: Page,
  email: string
): Promise<void> {
  await waitForCheckoutAddressForm(page);
  const form = page.locator(".checkout-form");
  await form.locator('input[autocomplete="name"]').fill("E2E Test Buyer");
  await form.locator('input[autocomplete="street-address"]').fill("123 MG Road");
  await form.getByRole("textbox", { name: "City", exact: true }).fill("Mumbai");
  await form.locator('input[autocomplete="postal-code"]').fill("400001");
  await form.locator('input[autocomplete="tel"], input[type="tel"]').first().fill("9876543210");
  await form.locator('input[autocomplete="email"], input[type="email"]').first().fill(email);
}

export function mutationHeaders(): Record<string, string> {
  return {
    Origin: E2E_ORIGIN,
    Referer: `${E2E_ORIGIN}/checkout`,
    "Content-Type": "application/json",
  };
}

export const guestShippingAddress = {
  name: "E2E Test Buyer",
  line1: "123 MG Road",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  country: "India",
  phone: "9876543210",
};

/** True when the app health endpoint reports PostgreSQL as ok. */
export async function isDatabaseHealthy(
  request: APIRequestContext
): Promise<boolean> {
  try {
    const response = await request.get("/api/health", { timeout: 10_000 });
    if (!response.ok()) return false;
    const body = (await response.json()) as {
      checks?: { database?: string };
      database?: { ok?: boolean };
    };
    return body.checks?.database === "ok" || body.database?.ok === true;
  } catch {
    return false;
  }
}
