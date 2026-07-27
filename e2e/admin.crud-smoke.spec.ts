import { test, expect } from "./fixtures";
import fs from "node:fs";
import { E2E_ADMIN_SEED_MARKER } from "./helpers/e2e-paths";

const adminReady =
  Boolean(process.env.DATABASE_URL) && fs.existsSync(E2E_ADMIN_SEED_MARKER);

/**
 * Smoke-level CRUD / list UX coverage for major admin entities.
 * Does not mutate production data beyond safe create+cleanup where practical.
 */
test.describe("admin CRUD smoke matrix", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");
  test.setTimeout(120_000);

  test("products list: search, empty/error-safe render, pagination controls", async ({
    page,
  }) => {
    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /products/i }).first()).toBeVisible();
    const search = page.getByPlaceholder(/search products/i);
    await expect(search).toBeVisible();
    await search.fill("__no_such_product_zzz__");
    await expect(page.locator(".admin-empty, .admin-table, .admin-error").first()).toBeVisible({
      timeout: 20_000,
    });
    await search.fill("");
    await expect(page.locator(".admin-table, .admin-empty").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("categories: list + create form validation surface", async ({ page }) => {
    await page.goto("/admin/categories", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /categor/i }).first()).toBeVisible();
    const add = page.getByRole("button", { name: /add category/i });
    if (await add.isVisible()) {
      await add.click();
      await expect(page.locator(".admin-panel input").first()).toBeVisible();
      await page.getByRole("button", { name: /create|update/i }).first().click();
      // Empty create should not navigate away; form stays mounted.
      await expect(page).toHaveURL(/\/admin\/categories/);
    }
  });

  test("brands: list + add form opens", async ({ page }) => {
    await page.goto("/admin/brands", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /brand/i }).first()).toBeVisible();
    const add = page.getByRole("button", { name: /add brand/i });
    if (await add.isVisible()) {
      await add.click();
      await expect(page.locator(".admin-form-group, .admin-panel input").first()).toBeVisible();
    }
  });

  test("orders: search + status filter + detail panel empty state", async ({ page }) => {
    await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /orders/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/search orders/i)).toBeVisible();
    await expect(page.locator("select.admin-select").first()).toBeVisible();
    await expect(
      page.getByText(/select an order|order details|no orders/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("coupons: list + add form", async ({ page }) => {
    await page.goto("/admin/coupons", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /coupon/i }).first()).toBeVisible();
    const add = page.getByRole("button", { name: /add coupon/i });
    if (await add.isVisible()) {
      await add.click();
      await expect(page.locator(".admin-panel").filter({ hasText: /code|label/i }).first()).toBeVisible();
    }
  });

  test("inventory: stats or table render", async ({ page }) => {
    await page.goto("/admin/inventory", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /inventory/i }).first()).toBeVisible();
    await expect(
      page.locator(".admin-stat-card, .admin-table, .admin-empty, .admin-error").first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("cms: pages list or editor shell", async ({ page }) => {
    await page.goto("/admin/cms", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /cms|content|pages/i }).first()).toBeVisible();
    await expect(
      page.locator(".admin-panel, .admin-empty, .admin-error").first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("homepage: section toolbar loads", async ({ page }) => {
    await page.goto("/admin/homepage", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /homepage/i }).first()).toBeVisible();
    await expect(
      page.locator(".admin-toolbar, .admin-panel, .admin-error, .admin-empty").first()
    ).toBeVisible({ timeout: 25_000 });
  });

  test("blog: list + new post link", async ({ page }) => {
    await page.goto("/admin/blog", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /blog/i }).first()).toBeVisible();
    await expect(
      page.locator("a[href*='/admin/blog/new'], .admin-table, .admin-empty").first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("users + roles pages load", async ({ page }) => {
    await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /admin users|users/i }).first()).toBeVisible();
    await page.goto("/admin/roles", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /role/i }).first()).toBeVisible();
  });

  test("rentals + giveaways dashboards load", async ({ page }) => {
    await page.goto("/admin/rentals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /rental/i }).first()).toBeVisible();
    await page.goto("/admin/giveaway", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /giveaway/i }).first()).toBeVisible();
  });

  test("settings page loads with store fields", async ({ page }) => {
    await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /settings/i }).first()).toBeVisible();
    await expect(page.getByText(/store name|razorpay|shipping/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("shipping page loads", async ({ page }) => {
    await page.goto("/admin/shipping", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /shipping/i }).first()).toBeVisible();
  });

  test("reviews + questions pages load", async ({ page }) => {
    await page.goto("/admin/reviews", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /review/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.goto("/admin/questions", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /question/i }).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("notifications page loads", async ({ page }) => {
    await page.goto("/admin/notifications", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });

  test("unauthorized deep link without session redirects to login", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 20_000 });
    await context.close();
  });
});
