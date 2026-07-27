import { test, expect } from "./fixtures";

test.describe("admin console", () => {
  test("admin login page loads", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("admin routes redirect unauthenticated users", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("admin sub-routes redirect when unauthenticated", async ({ page }) => {
    const routes = [
      "/admin/products",
      "/admin/analytics",
      "/admin/rentals",
      "/admin/giveaway",
      "/admin/compare",
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });
});

test.describe("admin APIs", () => {
  test("admin analytics requires auth", async ({ request }) => {
    const response = await request.get("/api/admin/compare/analytics");
    expect(response.status()).toBeGreaterThanOrEqual(401);
  });

  test("admin health-adjacent rental analytics requires auth", async ({ request }) => {
    const response = await request.get("/api/admin/rentals/analytics");
    expect(response.status()).toBeGreaterThanOrEqual(401);
  });

  test("admin core APIs require auth", async ({ request }) => {
    const paths = [
      "/api/admin/me",
      "/api/admin/products",
      "/api/admin/orders",
      "/api/admin/users",
      "/api/admin/settings",
    ];
    for (const path of paths) {
      const res = await request.get(path);
      expect(res.status(), path).toBeGreaterThanOrEqual(401);
    }
  });

  test("CSRF blocks cross-origin admin mutation without session", async ({
    request,
  }) => {
    const res = await request.post("/api/admin/products", {
      headers: {
        Origin: "https://evil.example",
        Referer: "https://evil.example/attack",
        "Content-Type": "application/json",
      },
      data: { name: "x" },
    });
    expect([401, 403]).toContain(res.status());
  });
});
