import { test, expect } from "./fixtures";
import fs from "node:fs";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./helpers/e2e-credentials";
import { isE2EAdminReady } from "./helpers/admin-ready";
import { loginAsE2EAdmin } from "./helpers/admin-auth";
import { isE2EServerMode } from "./helpers/e2e-server";
import {
  BULK_IMPORT_FIXTURE_CSV,
  buildSkuImageZip,
  confirmBulkImportViaApi,
  deleteAdminProduct,
  findAdminProductIdBySku,
  generateE2EBulkImportSku,
  runBulkImportWizardConfirm,
} from "./helpers/bulk-import";

const adminReady = isE2EAdminReady();

const FIXTURE_CSV = BULK_IMPORT_FIXTURE_CSV;

const ORIGINAL_PASSWORD = E2E_ADMIN_PASSWORD;
const RESET_PASSWORD = "E2eResetPass!999";

test.describe("Admin password reset full flow", () => {
  test.skip(!adminReady, "DATABASE_URL / seeded E2E admin required");

  test("request reset, set new password, login, restore password", async ({ page, request }) => {
    test.setTimeout(120_000);
    test.skip(!(await isE2EServerMode(request)), "Server must run with E2E_TEST_MODE=true");

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
    test.skip(!(await isE2EServerMode(request)), "Server must run with E2E_TEST_MODE=true");
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

  test("authenticated template API returns CSV and XLSX downloads", async ({ request }) => {
    const csvRes = await request.get("/api/admin/products/import/template?format=csv");
    expect(csvRes.ok()).toBeTruthy();
    expect(csvRes.headers()["content-type"]).toContain("text/csv");
    expect(csvRes.headers()["content-disposition"]).toMatch(/vibemusic bulk\.csv/i);
    const csvBody = await csvRes.text();
    expect(csvBody.split(",").length).toBeGreaterThanOrEqual(81);

    const xlsxRes = await request.get("/api/admin/products/import/template?format=xlsx");
    expect(xlsxRes.ok()).toBeTruthy();
    expect(xlsxRes.headers()["content-type"]).toContain("spreadsheetml.sheet");
    expect(xlsxRes.headers()["content-disposition"]).toMatch(/vibemusic bulk\.xlsx/i);
    expect((await xlsxRes.body()).byteLength).toBeGreaterThan(100);
  });

  test("preview valid CSV and reject invalid file type", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Import products/i }).click();
    await expect(page.locator("#bulk-import-title")).toBeVisible();

    await expect(page.getByRole("link", { name: /vibemusic bulk\.xlsx/i })).toHaveAttribute(
      "href",
      "/api/admin/products/import/template?format=xlsx",
    );
    await expect(page.getByRole("link", { name: /vibemusic bulk\.csv/i })).toHaveAttribute(
      "href",
      "/api/admin/products/import/template?format=csv",
    );

    await page.locator("#bulk-import-sheet").setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not,a,valid,import"),
    });
    await expect(page.getByText(/Vibe Music bulk template as \.xlsx or \.csv/i)).toBeVisible();

    await page.locator("#bulk-import-sheet").setInputFiles(FIXTURE_CSV);
    await page.getByRole("button", { name: /Continue to options/i }).click();
    await page.getByRole("button", { name: /Run validation preview/i }).click();
    await expect(page.getByText(/Creates/i)).toBeVisible({ timeout: 30_000 });
    const previewTable = page.locator('table[aria-label="Import preview"]');
    await expect(previewTable.locator("tbody tr").first()).toBeVisible();
  });

  test("preview resolves seven SKU-matched ZIP images for bulk import", async ({ request }) => {
    const sku = "E2E-IMPORT-001";
    const zip = buildSkuImageZip(sku);

    const response = await request.post("/api/admin/products/import", {
      multipart: {
        file: {
          name: "bulk-import-e2e.csv",
          mimeType: "text/csv",
          buffer: fs.readFileSync(FIXTURE_CSV),
        },
        zip: {
          name: "product-images.zip",
          mimeType: "application/zip",
          buffer: zip.toBuffer(),
        },
        options: JSON.stringify({
          duplicateStrategy: "update",
          publishStatus: "draft",
        }),
        confirm: "false",
      },
    });

    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as {
      preview?: Array<{
        sku?: string;
        generatedSku?: string;
        imageCount?: number;
        zipImageMatchPreview?: string[];
      }>;
    };

    const row = payload.preview?.find((entry) => entry.sku === sku || entry.generatedSku === sku);
    expect(row?.imageCount).toBe(7);
    expect(row?.zipImageMatchPreview).toHaveLength(7);
    expect(row?.zipImageMatchPreview?.[0]).toMatch(/e2e-import-001_1\.jpg/i);
    expect(row?.zipImageMatchPreview?.[6]).toMatch(/e2e-import-001_7\.jpg/i);
  });

  test("bulk import wizard shows updated copy and seven-image preview", async ({ page }) => {
    test.setTimeout(120_000);
    const sku = "E2E-IMPORT-001";
    const zip = buildSkuImageZip(sku);

    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Import products/i }).click();
    await expect(page.locator("#bulk-import-title")).toBeVisible();
    await expect(page.locator(".bulk-import-images-guide")).toContainText(/image12/i);
    await expect(page.locator(".bulk-import-template-panel__hint")).toContainText(
      /image1–image12/i,
    );

    await page.locator("#bulk-import-sheet").setInputFiles(FIXTURE_CSV);
    await page.locator("#bulk-import-zip").setInputFiles({
      name: "product-images.zip",
      mimeType: "application/zip",
      buffer: zip.toBuffer(),
    });

    await page.getByRole("button", { name: /Continue to options/i }).click();
    await expect(page.getByText(/Update existing \(recommended\)/i)).toBeVisible();
    await page.getByRole("button", { name: /Run validation preview/i }).click();

    const previewTable = page.locator('table[aria-label="Import preview"]');
    await expect(previewTable.getByRole("columnheader", { name: "Images" })).toBeVisible({
      timeout: 30_000,
    });
    const previewRow = previewTable.locator("tbody tr").first();
    await expect(previewRow).toContainText(/7:/i);
    await expect(previewRow.locator("td[title*='e2e-import-001_7']")).toBeVisible();
  });

  test("confirm import API persists seven images for new SKU", async ({ request }) => {
    const sku = generateE2EBulkImportSku("E2EAPI");
    let productId: string | undefined;

    try {
      const result = await confirmBulkImportViaApi(request, {
        sku,
        productName: "E2E API Confirm Guitar",
        publishStatus: "draft",
      });

      expect(result.imported).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.images).toHaveLength(7);
      productId = result.productId;
      expect(productId).toBeTruthy();

      const getRes = await request.get(`/api/admin/products/${productId}`);
      expect(getRes.ok()).toBeTruthy();
      const loaded = (await getRes.json()) as { product?: { images?: string[] } };
      expect(loaded.product?.images).toHaveLength(7);
    } finally {
      if (productId) {
        await deleteAdminProduct(request, productId);
      }
    }
  });

  test("confirm import creates product with seven images on admin edit page", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const sku = generateE2EBulkImportSku("E2EIMP");
    const productName = "E2E Confirm Import Guitar";
    let productId: string | undefined;

    try {
      await runBulkImportWizardConfirm(page, { sku, productName, publishStatus: "draft" });

      await page.getByRole("textbox", { name: /Search products/i }).fill(sku);
      const productRow = page.locator(".admin-table tbody tr").filter({ hasText: sku });
      await expect(productRow).toBeVisible({ timeout: 30_000 });
      await productRow.getByRole("link", { name: "Edit" }).click();

      await expect(page).toHaveURL(/\/admin\/products\/[^/]+$/);
      await expect(page.getByText(/Loading product/i)).toBeHidden({ timeout: 30_000 });
      await expect(page.locator("#product-form-sku")).toHaveValue(sku);
      await expect(page.locator(".admin-image-preview-grid .admin-image-preview")).toHaveCount(7);
      await expect(page.locator(".admin-image-preview-grid img")).toHaveCount(7);

      const match = page.url().match(/\/admin\/products\/([^/?#]+)/);
      productId = match?.[1];

      const getRes = await request.get(`/api/admin/products/${productId}`);
      expect(getRes.ok()).toBeTruthy();
      const loaded = (await getRes.json()) as { product?: { images?: string[] } };
      expect(loaded.product?.images).toHaveLength(7);
    } finally {
      if (productId) {
        await deleteAdminProduct(request, productId);
      } else {
        const fallbackId = await findAdminProductIdBySku(request, sku);
        if (fallbackId) await deleteAdminProduct(request, fallbackId);
      }
    }
  });

  test("bulk import full flow: PDP gallery, editable images, and SKU re-import update", async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    const sku = generateE2EBulkImportSku("E2EFULL");
    const productName = "E2E Full Flow Import Guitar";
    let productId: string | undefined;

    try {
      await runBulkImportWizardConfirm(page, {
        sku,
        productName,
        category: "DJ Equipment",
        publishStatus: "active",
      });

      await page.getByRole("textbox", { name: /Search products/i }).fill(sku);
      const productRow = page.locator(".admin-table tbody tr").filter({ hasText: sku });
      await expect(productRow).toBeVisible({ timeout: 30_000 });
      await productRow.getByRole("link", { name: "Edit" }).click();
      await expect(page.getByText(/Loading product/i)).toBeHidden({ timeout: 30_000 });

      await expect(page.locator(".admin-image-preview-grid .admin-image-preview")).toHaveCount(7);
      const slug = await page.locator("#product-form-slug").inputValue();
      expect(slug.length).toBeGreaterThan(0);

      const match = page.url().match(/\/admin\/products\/([^/?#]+)/);
      productId = match?.[1];

      await expect
        .poll(
          async () => {
            await page.goto(`/product/${slug}`, { waitUntil: "domcontentloaded" });
            return page.locator(".pdp-gallery__thumbs .pdp-gallery__thumb").count();
          },
          { timeout: 30_000, message: "PDP gallery should show seven images after import" },
        )
        .toBe(7);

      await page.goto(`/admin/products/${productId}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Loading product/i)).toBeHidden({ timeout: 30_000 });
      await page
        .locator(".admin-image-preview-grid .admin-image-preview")
        .first()
        .getByRole("button", { name: /Remove/i })
        .click();
      await expect(page.locator(".admin-image-preview-grid .admin-image-preview")).toHaveCount(6);
      await page.getByRole("button", { name: /Update Product/i }).click();
      await expect(page.getByRole("status")).toContainText(/Product updated successfully/i, {
        timeout: 30_000,
      });

      await expect
        .poll(
          async () => {
            const getRes = await request.get(`/api/admin/products/${productId}`);
            const loaded = (await getRes.json()) as { product?: { images?: string[] } };
            return loaded.product?.images?.length ?? 0;
          },
          { timeout: 20_000, message: "admin API should persist six images after edit" },
        )
        .toBe(6);

      await expect
        .poll(
          async () => {
            await page.goto(`/product/${slug}`, { waitUntil: "domcontentloaded" });
            return page.locator(".pdp-gallery__thumbs .pdp-gallery__thumb").count();
          },
          { timeout: 30_000, message: "PDP gallery should reflect saved image count" },
        )
        .toBe(6);

      const reimport = await confirmBulkImportViaApi(request, {
        sku,
        productName,
        category: "DJ Equipment",
        publishStatus: "active",
        duplicateStrategy: "update",
      });
      expect(reimport.updated).toBe(1);
      expect(reimport.images).toHaveLength(7);

      await page.goto(`/admin/products/${productId}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Loading product/i)).toBeHidden({ timeout: 30_000 });
      await expect(page.locator(".admin-image-preview-grid .admin-image-preview")).toHaveCount(7);

      await expect
        .poll(
          async () => {
            await page.goto(`/product/${slug}`, { waitUntil: "domcontentloaded" });
            return page.locator(".pdp-gallery__thumbs .pdp-gallery__thumb").count();
          },
          { timeout: 30_000, message: "PDP gallery should show seven images after re-import" },
        )
        .toBe(7);
    } finally {
      if (productId) {
        await deleteAdminProduct(request, productId);
      } else {
        const fallbackId = await findAdminProductIdBySku(request, sku);
        if (fallbackId) await deleteAdminProduct(request, fallbackId);
      }
    }
  });

  test("legacy CSV headers are rejected at preview", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Import products/i }).click();

    const legacyCsv = "name,brand,category,price\nLegacy Product,Legacy Brand,Guitars,1000\n";
    await page.locator("#bulk-import-sheet").setInputFiles({
      name: "legacy.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(legacyCsv),
    });
    await page.getByRole("button", { name: /Continue to options/i }).click();
    await page.getByRole("button", { name: /Run validation preview/i }).click();
    await expect(page.locator(".admin-form-error")).toContainText(/vibemusic bulk\.(csv|xlsx)/i, {
      timeout: 30_000,
    });
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
