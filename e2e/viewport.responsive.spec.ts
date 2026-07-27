import { test, expect } from "./fixtures";

test.describe("viewport responsive smoke", () => {
  test("homepage + cart + search render without horizontal overflow (mobile)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/cart", "/search", "/compare"]) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, path).toBeLessThanOrEqual(2);
    }
  });

  test("homepage + cart render without horizontal overflow (tablet)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 834, height: 1112 });
    for (const path of ["/", "/cart", "/search"]) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, path).toBeLessThanOrEqual(2);
    }
  });

  test("admin login is usable at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Admin Login/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
