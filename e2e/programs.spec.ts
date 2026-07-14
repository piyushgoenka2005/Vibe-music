import { test, expect } from "./fixtures";

test.describe("enterprise program pages", () => {
  test("rentals hub loads", async ({ page }) => {
    await page.goto("/rentals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("financing hub loads EMI calculator", async ({ page }) => {
    await page.goto("/financing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/EMI|finance|Compare plans/i).first()).toBeVisible();
  });

  test("giveaway hub loads", async ({ page }) => {
    await page.goto("/giveaway", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("account financing redirects guests", async ({ page }) => {
    await page.goto("/account/financing");
    await expect(page).toHaveURL(/\/login/);
  });

  test("account giveaways redirects guests", async ({ page }) => {
    await page.goto("/account/giveaways");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("enterprise program APIs", () => {
  test("finance providers list responds", async ({ request }) => {
    const response = await request.get("/api/finance/providers");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.providers)).toBe(true);
  });

  test("giveaway campaigns list responds", async ({ request }) => {
    const response = await request.get("/api/giveaway/campaigns");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.campaigns)).toBe(true);
  });

  test("rental categories list responds", async ({ request }) => {
    const response = await request.get("/api/rentals/categories");
    expect(response.ok()).toBeTruthy();
  });

  test("finance calculate validates input", async ({ request }) => {
    const response = await request.post("/api/finance/calculate", {
      data: { orderValue: 500 },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
