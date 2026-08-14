import { test, expect } from "./fixtures";
import { E2E_ADMIN_EMAIL } from "./helpers/e2e-credentials";

async function fillPassword(page: import("@playwright/test").Page, value: string) {
  const input = page.locator('input[name="password"]');
  await input.click();
  await input.fill(value);
  await expect(input).toHaveValue(value, { timeout: 10_000 });
}

test.describe("Admin password eye toggle", () => {
  test("shows, hides, and preserves password on admin login", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await fillPassword(page, "TestSecret99!");
    await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "password");

    const toggle = page.getByRole("button", { name: /^Show password$/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "text");
    await expect(page.locator('input[name="password"]')).toHaveValue("TestSecret99!");

    await page.getByRole("button", { name: /^Hide password$/i }).click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "password");
    await expect(page.locator('input[name="password"]')).toHaveValue("TestSecret99!");
  });
});

test.describe("Admin forgot password entry point", () => {
  test("admin login links to forgot password page", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("link", { name: /Forgot password/i })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  test("forgot password form submits and shows success message", async ({ page }) => {
    await page.route("**/api/auth/forgot-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto("/forgot-password");
    await page.getByRole("textbox", { name: /^Email$/i }).fill(E2E_ADMIN_EMAIL);
    await page.getByRole("button", { name: /Send Reset Link/i }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /reset link sent/i })
    ).toBeVisible({ timeout: 20_000 });
  });

  test("reset page without token shows invalid link message", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/invalid|expired/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Request a new link/i })).toBeVisible();
  });

  test("reset password fields support visibility toggle", async ({ page }) => {
    await page.goto(
      "/reset-password?token=placeholder&email=test%40example.com",
      { waitUntil: "domcontentloaded" }
    );
    const password = page.locator('input[name="password"]');
    await password.fill("NewSecure99!");
    const toggle = page.getByRole("button", { name: /^Show password$/i }).first();
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("NewSecure99!");
  });
});
