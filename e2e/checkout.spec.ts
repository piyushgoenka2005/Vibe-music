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

  test("deals page loads", async ({ page }) => {
    await page.goto("/deals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("brands page loads", async ({ page }) => {
    await page.goto("/brands", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("product detail page loads from API slug", async ({ page, request }) => {
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
  test("cart shows seeded product", async ({ page, request }) => {
    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(product.name).first()).toBeVisible({ timeout: 15_000 });
  });

  test("compare page accepts share API", async ({ request }) => {
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
  test.describe.configure({ mode: "serial" });

  test("COD checkout completes for guest cart", async ({ page, request }) => {
    test.setTimeout(120_000);
    test.skip(
      !process.env.DATABASE_URL,
      "DATABASE_URL required for order persistence"
    );

    const caps = await request.get("/api/checkout/capabilities");
    const capsBody = (await caps.json()) as { cod?: { enabled?: boolean } };
    test.skip(!capsBody.cod?.enabled, "COD disabled in environment (expected for production)");

    const product = await fetchCheckoutProduct(request);
    await seedGuestCart(page, product);
    const email = `e2e-guest-${Date.now()}@example.com`;

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await waitForCheckoutAddressForm(page);
    await fillGuestCheckoutAddress(page, email);
    await page.getByRole("button", { name: /Continue to Review/i }).click();
    await page.getByRole("button", { name: /Continue to Payment/i }).click();
    await page.getByText("Cash on Delivery").click();
    const placeOrder = page.getByRole("button", { name: /Place order \(COD\)/i });
    await expect(placeOrder).toBeEnabled({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL(/\/checkout\/success/, { timeout: 60_000 }),
      placeOrder.click(),
    ]);
    await expect(page.getByText(/order|confirmed|success/i).first()).toBeVisible();
  });

  test("create-order API accepts valid COD payload", async ({ request }) => {
    test.skip(
      !process.env.DATABASE_URL,
      "DATABASE_URL required for order persistence"
    );

    const caps = await request.get("/api/checkout/capabilities");
    const capsBody = (await caps.json()) as { cod?: { enabled?: boolean } };
    test.skip(!capsBody.cod?.enabled, "COD disabled in environment (expected for production)");

    const product = await fetchCheckoutProduct(request);
    const response = await request.post("/api/payment/create-order", {
      headers: mutationHeaders(),
      data: {
        items: [
          {
            productId: product.id,
            name: product.name,
            quantity: 1,
            price: product.price,
          },
        ],
        email: `e2e-api-${Date.now()}@example.com`,
        paymentMethod: "cod",
        shippingAddress: guestShippingAddress,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.order?.id ?? body.orderId).toBeTruthy();
  });
});
