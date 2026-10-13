import { test, expect } from "./fixtures";
import { E2E_ADMIN_EMAIL } from "./helpers/e2e-credentials";

test.describe("Admin password eye toggle", () => {
  test("shows, hides, and preserves password on admin login", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    const input = page.locator('input[name="password"]');

    // Reveal the password *first*. Toggling type only works once React has
    // hydrated, which guarantees the controlled field will hold typed input.
    const showToggle = page.getByRole("button", { name: /^Show password$/i });
    await expect(async () => {
      await showToggle.click({ timeout: 2_000 });
      await expect(input).toHaveAttribute("type", "text", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });

    await input.fill("TestSecret99!");
    await expect(input).toHaveValue("TestSecret99!");

    await page.getByRole("button", { name: /^Hide password$/i }).click();
    await expect(input).toHaveAttribute("type", "password");
    await expect(input).toHaveValue("TestSecret99!");
  });
});

test.describe("Admin forgot password entry point", () => {
  test("admin login links to forgot password page", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("link", { name: /Forgot password/i })).toHaveAttribute(
      "href",
      "/forgot-password",
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
    await expect(page.getByRole("alert").filter({ hasText: /reset link sent/i })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("reset page without token shows invalid link message", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/invalid|expired/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Request a new link/i })).toBeVisible();
  });

  test("reset password fields support visibility toggle", async ({ page }) => {
    await page.goto("/reset-password?token=placeholder&email=test%40example.com", {
      waitUntil: "domcontentloaded",
    });
    const password = page.locator('input[name="password"]');
    // Reveal first so we know the controlled field is hydrated before typing.
    const toggle = page.getByRole("button", { name: /^Show password$/i }).first();
    await expect(async () => {
      await toggle.click({ timeout: 2_000 });
      await expect(password).toHaveAttribute("type", "text", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    await password.fill("NewSecure99!");
    await expect(password).toHaveValue("NewSecure99!");
  });
});
