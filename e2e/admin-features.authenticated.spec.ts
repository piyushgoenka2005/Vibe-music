import { test, expect } from "./fixtures";
import fs from "node:fs";
import path from "node:path";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./helpers/e2e-credentials";
import { isE2EAdminReady } from "./helpers/admin-ready";
import { e2eMutationHeaders } from "./helpers/e2e-origin";
import { loginAsE2EAdmin } from "./helpers/admin-auth";

const adminReady = isE2EAdminReady();

const FIXTURE_CSV = path.join(__dirname, "fixtures", "bulk-import-e2e.csv");
const ORIGINAL_PASSWORD = E2E_ADMIN_PASSWORD;
const RESET_PASSWORD = "E2eResetPass!999";

test.describe("Admin password reset full flow", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");

  test("request reset, set new password, login, restore password", async ({ page, request }) => {
    test.setTimeout(120_000);

    // /reset-password is a guest-only route; drop the admin session so the
    // reset form renders instead of redirecting to /account.
    await page.context().clearCookies();

    await request.delete("/api/e2e/password-reset");

    const forgotRes = await request.post("/api/auth/forgot-password", {
      headers: e2eMutationHeaders(),
      data: { email: E2E_ADMIN_EMAIL },
    });
    expect(forgotRes.ok()).toBeTruthy();

    const captureRes = await request.get("/api/e2e/password-reset");
    expect(captureRes.ok()).toBeTruthy();
    const capture = (await captureRes.json()) as {
      resetUrl: string;
      token: string;
    };
    expect(capture.resetUrl).toContain("reset-password");
    expect(capture.token.length).toBeGreaterThan(10);

    await page.goto(capture.resetUrl, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="password"]').fill(RESET_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(RESET_PASSWORD);
    await page.getByRole("button", { name: /Update password/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

    await page.goto("/admin/login");
    await page.locator('input[name="email"]').fill(E2E_ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(RESET_PASSWORD);
    await page.getByRole("button", { name: /Admin Login/i }).click();
    await expect(page).toHaveURL(/\/admin(?:\/)?$/, { timeout: 30_000 });

    await request.delete("/api/e2e/password-reset");
    const restoreForgot = await request.post("/api/auth/forgot-password", {
      headers: e2eMutationHeaders(),
      data: { email: E2E_ADMIN_EMAIL },
    });
    expect(restoreForgot.ok()).toBeTruthy();
    const restore = await (await request.get("/api/e2e/password-reset")).json();
    // Re-entering the guest-only reset page after the re-login above.
    await page.context().clearCookies();
    await page.goto(restore.resetUrl, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="password"]').fill(ORIGINAL_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(ORIGINAL_PASSWORD);
    await page.getByRole("button", { name: /Update password/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

    await loginAsE2EAdmin(page);
    await expect(page).toHaveURL(/\/admin(?:\/)?$/);
  });

  test("rejects reused reset token", async ({ page, request }) => {
    test.setTimeout(90_000);
    // Guest-only reset page — drop the authenticated admin session first.
    await page.context().clearCookies();
    await request.delete("/api/e2e/password-reset");
    await request.post("/api/auth/forgot-password", {
      headers: e2eMutationHeaders(),
      data: { email: E2E_ADMIN_EMAIL },
    });
    const capture = (await request.get("/api/e2e/password-reset")).json();
    const { resetUrl } = await capture;

    await page.goto(resetUrl, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="password"]').fill("TempReset!12345");
    await page.locator('input[name="confirmPassword"]').fill("TempReset!12345");
    await page.getByRole("button", { name: /Update password/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

    await page.goto(resetUrl, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="password"]').fill("AnotherPass!123");
    await page.locator('input[name="confirmPassword"]').fill("AnotherPass!123");
    await page.getByRole("button", { name: /Update password/i }).click();
    // Ignore Next.js's route announcer, which also carries role="alert".
    const reuseAlert = page.getByRole("alert").filter({ hasText: /invalid|expired/i });
    await expect(reuseAlert).toContainText(/invalid|expired/i);

    await request.delete("/api/e2e/password-reset");
    await request.post("/api/auth/forgot-password", {
      headers: e2eMutationHeaders(),
      data: { email: E2E_ADMIN_EMAIL },
    });
    const restore = await (await request.get("/api/e2e/password-reset")).json();
    await page.goto(restore.resetUrl);
    await page.locator('input[name="password"]').fill(ORIGINAL_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(ORIGINAL_PASSWORD);
    await page.getByRole("button", { name: /Update password/i }).click();
  });
});

test.describe("Bulk import upload", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");
  test.skip(!fs.existsSync(FIXTURE_CSV), "bulk-import-e2e.csv fixture missing");

  test("preview valid CSV and reject invalid file type", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Import CSV/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.locator("#bulk-import-csv").setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not,a,valid,import"),
    });
    await expect(page.getByText(/Upload a \.csv file/i)).toBeVisible();

    await page.locator("#bulk-import-csv").setInputFiles(FIXTURE_CSV);
    await page.getByRole("button", { name: /Preview import/i }).click();
    await expect(page.getByText(/Preview ready:/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".admin-table tbody tr").first()).toBeVisible();
  });
});

test.describe("Product image fit (PDP)", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");

  test("gallery image uses object-fit contain on mobile viewport", async ({ page, request }) => {
    const productsRes = await request.get("/api/products?limit=1");
    test.skip(!productsRes.ok(), "catalog API unavailable");
    const payload = (await productsRes.json()) as {
      products?: Array<{ slug: string }>;
    };
    const slug = payload.products?.[0]?.slug;
    test.skip(!slug, "no products in catalog");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/product/${slug}`, { waitUntil: "domcontentloaded" });
    // The main gallery image carries the product alt text (the 360 viewer's
    // photo is alt=""), and its object-fit:contain comes from a CSS rule that
    // may land a beat after first paint in dev — so poll for it.
    const photo = page.locator('.pdp-gallery__photo[alt]:not([alt=""]) ').first();
    await expect(photo).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(
        () =>
          photo.evaluate((el) => {
            const image = el as HTMLImageElement;
            return {
              loaded: image.complete && image.naturalWidth > 0,
              objectFit: getComputedStyle(el).objectFit,
            };
          }),
        { timeout: 15_000, message: "gallery photo should settle to object-fit: contain" },
      )
      .toEqual({ loaded: true, objectFit: "contain" });
  });
});
