import { test, expect } from "./fixtures";
import fs from "node:fs";
import { loginAsE2EAdmin } from "./helpers/admin-auth";
import { E2E_ADMIN_SEED_MARKER } from "./helpers/e2e-paths";

const adminReady =
  Boolean(process.env.DATABASE_URL) && fs.existsSync(E2E_ADMIN_SEED_MARKER);

test.describe("admin console (authenticated)", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");

  test("Admin Login form reaches dashboard", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await loginAsE2EAdmin(page);
    await expect(page).toHaveURL(/\/admin(?:\/)?$/);
    await expect(page.getByText(/dashboard|orders|products/i).first()).toBeVisible();
    await context.close();
  });

  test("authenticated admin reaches dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin(?:\/)?$/, { timeout: 20_000 });
    await expect(page.getByText(/dashboard|orders|products/i).first()).toBeVisible();
  });

  test("sidebar deep links reach major admin sections", async ({ page }) => {
    const routes: Array<{ path: string; title: RegExp }> = [
      { path: "/admin/products", title: /products/i },
      { path: "/admin/categories", title: /categor/i },
      { path: "/admin/brands", title: /brand/i },
      { path: "/admin/orders", title: /order/i },
      { path: "/admin/coupons", title: /coupon/i },
      { path: "/admin/shipping", title: /shipping/i },
      { path: "/admin/cms", title: /cms|content|pages/i },
      { path: "/admin/homepage", title: /homepage|section/i },
      { path: "/admin/blog", title: /blog/i },
      { path: "/admin/users", title: /admin users|users/i },
      { path: "/admin/roles", title: /role/i },
      { path: "/admin/rentals", title: /rental/i },
      { path: "/admin/giveaway", title: /giveaway/i },
      { path: "/admin/inventory", title: /inventory/i },
      { path: "/admin/settings", title: /settings/i },
    ];

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, "\\/")));
      await expect(page.getByRole("heading", { name: route.title }).first()).toBeVisible({
        timeout: 20_000,
      });
    }
  });

  test("browser refresh keeps admin session on dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin(?:\/)?$/);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin(?:\/)?$/);
    await expect(page.getByText(/dashboard|orders|products/i).first()).toBeVisible();
  });

  test("logout returns to admin login", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: /open admin navigation/i }).click().catch(() => undefined);
    const logout = page.getByRole("button", { name: /sign out/i }).first();
    await expect(logout).toBeVisible({ timeout: 15_000 });
    await logout.click();
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 20_000 });
  });
});
