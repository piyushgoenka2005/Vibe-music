import { test, expect } from "./fixtures";

test.describe("admin console (authenticated)", () => {
  test("authenticated admin reaches dashboard", async ({ page }) => {
    test.skip(
      !process.env.DATABASE_URL,
      "DATABASE_URL required for admin auth E2E"
    );

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin(?:\/)?$/, { timeout: 20_000 });
    await expect(page.getByText(/dashboard|orders|products/i).first()).toBeVisible();
  });
});
