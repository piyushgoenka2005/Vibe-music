import { test, expect } from "@playwright/test";

test.describe("storefront smoke", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("policy page loads", async ({ page }) => {
    await page.goto("/pages/shipping", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("h1.storefront-page__title")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("cart page loads", async ({ page }) => {
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("account routes redirect unauthenticated users", async ({ page }) => {
    await page.goto("/account/support");
    await expect(page).toHaveURL(/\/login/);
  });

  test("checkout page loads", async ({ page }) => {
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("compare page loads", async ({ page }) => {
    await page.goto("/compare", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Compare Products/i);
    await expect(
      page.getByRole("heading", { name: "Compare Products", level: 1 })
    ).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("track order page loads", async ({ page }) => {
    await page.goto("/track-order", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("homepage has no horizontal overflow at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("newsletter subscribe endpoint validates input", async ({ request }) => {
    const response = await request.post("/api/newsletter/subscribe", {
      data: { email: "not-an-email" },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("admin smoke", () => {
  test("admin login page loads", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("admin routes redirect unauthenticated users", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("api smoke", () => {
  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
  });

  test("shipping quote endpoint responds", async ({ request }) => {
    const response = await request.post("/api/shipping/quote", {
      data: {
        subtotal: 5000,
        discount: 0,
        postalCode: "400001",
        state: "Maharashtra",
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.methods?.length).toBeGreaterThan(0);
  });

  test("support ticket endpoint validates input", async ({ request }) => {
    const response = await request.post("/api/support/tickets", {
      data: { name: "A", email: "bad", subject: "x", message: "short" },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("checkout capabilities exposes payment flags", async ({ request }) => {
    const response = await request.get("/api/checkout/capabilities");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(typeof body.onlinePaymentsAvailable).toBe("boolean");
    expect(typeof body.placesAutocomplete).toBe("boolean");
    expect(body.cod).toBeTruthy();
    expect(typeof body.cod.enabled).toBe("boolean");
    expect(typeof body.cod.maxOrderValue).toBe("number");
  });

  test("create-order rejects empty cart", async ({ request }) => {
    const response = await request.post("/api/payment/create-order", {
      data: {
        items: [],
        email: "buyer@example.com",
        paymentMethod: "cod",
        shippingAddress: {
          name: "Test Buyer",
          line1: "1 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("program landings", () => {
  test("giveaway page loads honest status", async ({ page }) => {
    await page.goto("/giveaway", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/no live giveaway|no active contest/i)).toBeVisible();
  });

  test("financing page loads payment honesty", async ({ page }) => {
    await page.goto("/financing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/not live|Razorpay|UPI/i).first()).toBeVisible();
  });

  test("used gear page loads", async ({ page }) => {
    await page.goto("/used", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("rentals page loads", async ({ page }) => {
    await page.goto("/rentals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
