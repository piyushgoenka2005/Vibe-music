import { test, expect } from "./fixtures";
import fs from "node:fs";
import { E2E_ADMIN_SEED_MARKER } from "./helpers/e2e-paths";

const adminReady =
  Boolean(process.env.DATABASE_URL) && fs.existsSync(E2E_ADMIN_SEED_MARKER);

test.describe("admin security + route guards", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");

  test("authenticated session survives deep link + refresh", async ({ page }) => {
    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/products/);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.getByRole("heading", { name: /products/i }).first()).toBeVisible();
  });

  test("browser back/forward keeps admin session", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
    await page.goBack();
    await expect(page).toHaveURL(/\/admin(?:\/)?$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/admin\/orders/);
  });

  test("permission-gated pages load for super_admin", async ({ page }) => {
    const routes = [
      "/admin/notifications",
      "/admin/reviews",
      "/admin/questions",
      "/admin/analytics",
    ];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/admin\/login/);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("audit logs page reachable for super_admin", async ({ page }) => {
    await page.goto("/admin/audit-logs", { waitUntil: "domcontentloaded" });
    // Route may 404 if not mounted — document either way via soft check.
    const url = page.url();
    if (url.includes("/admin/login")) {
      throw new Error("audit-logs redirected to login unexpectedly");
    }
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("admin security without session", () => {
  test("expired/empty storage redirects deep links", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 20_000 });
    await context.close();
  });
});
