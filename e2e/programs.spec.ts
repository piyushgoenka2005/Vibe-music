import { test, expect } from "./fixtures";

test.describe("enterprise program pages", () => {
  test("rentals hub loads", async ({ page }) => {
    await page.goto("/rentals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("giveaway hub loads", async ({ page }) => {
    await page.goto("/giveaway", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("account giveaways redirects guests", async ({ page }) => {
    await page.goto("/account/giveaways");
    await expect(page).toHaveURL(/\/login/);
  });

  test("retired financing paths redirect", async ({ page }) => {
    await page.goto("/financing", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/financing/);
  });
});

test.describe("enterprise program APIs", () => {
  test("giveaway campaigns list responds", async ({ request, requiresDatabase }) => {
    void requiresDatabase;
    const response = await request.get("/api/giveaway/campaigns");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.campaigns)).toBe(true);
  });

  test("rental categories list responds", async ({ request, requiresDatabase }) => {
    void requiresDatabase;
    const response = await request.get("/api/rentals/categories");
    expect(response.ok()).toBeTruthy();
  });
});
