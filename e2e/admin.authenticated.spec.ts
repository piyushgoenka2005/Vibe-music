import { test, expect } from "./fixtures";
import fs from "node:fs";
import { E2E_ADMIN_SEED_MARKER } from "./helpers/e2e-paths";

test.describe("admin console (authenticated)", () => {
  test("authenticated admin reaches dashboard", async ({ page }) => {
    test.skip(
      !process.env.DATABASE_URL || !fs.existsSync(E2E_ADMIN_SEED_MARKER),
      "DATABASE_URL / seeded E2E admin required for admin auth E2E"
    );

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin(?:\/)?$/, { timeout: 20_000 });
    await expect(page.getByText(/dashboard|orders|products/i).first()).toBeVisible();
  });
});
