import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import type { APIRequestContext, Page } from "@playwright/test";
import { E2E_TEST_JPEG } from "./test-jpeg";
import { e2eMutationHeaders } from "./e2e-origin";

export const BULK_IMPORT_FIXTURE_CSV = path.join(
  __dirname,
  "..",
  "fixtures",
  "bulk-import-e2e.csv",
);

/** Admin product SKU field allows max 120 characters (`ADMIN_PRODUCT_SKU_MAX_LENGTH`). */
export function generateE2EBulkImportSku(prefix = "E2E"): string {
  const suffix = Date.now().toString(36).slice(-8).toUpperCase();
  return `${prefix}${suffix}`.slice(0, 20);
}

export function buildBulkImportCsvForSku(
  sku: string,
  productName: string,
  options?: { category?: string },
): string {
  const raw = fs.readFileSync(BULK_IMPORT_FIXTURE_CSV, "utf8").trim();
  const [header, templateRow] = raw.split("\n");
  const columns = templateRow.split(",");
  columns[1] = sku;
  columns[3] = productName;
  if (options?.category) {
    columns[6] = options.category;
  }
  return `${header}\n${columns.join(",")}\n`;
}

export function buildSkuImageZip(sku: string, imageCount = 7): AdmZip {
  const zip = new AdmZip();
  for (let index = 1; index <= imageCount; index += 1) {
    zip.addFile(`${sku}_${index}.jpg`, E2E_TEST_JPEG);
  }
  return zip;
}

export type BulkImportWizardOptions = {
  sku: string;
  productName: string;
  category?: string;
  publishStatus?: "active" | "draft";
  duplicateStrategy?: "update" | "fail" | "skip";
};

export async function runBulkImportWizardConfirm(
  page: Page,
  options: BulkImportWizardOptions,
): Promise<void> {
  const {
    sku,
    productName,
    category,
    publishStatus = "draft",
    duplicateStrategy = "update",
  } = options;
  const csv = buildBulkImportCsvForSku(sku, productName, { category });
  const zip = buildSkuImageZip(sku);

  await page.goto("/admin/products", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Import products/i }).click();
  await page.locator("#bulk-import-sheet").setInputFiles({
    name: "bulk-import.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page.locator("#bulk-import-zip").setInputFiles({
    name: "product-images.zip",
    mimeType: "application/zip",
    buffer: zip.toBuffer(),
  });

  await page.getByRole("button", { name: /Continue to options/i }).click();

  if (duplicateStrategy === "fail") {
    await page.getByText(/Reject duplicates/i).click();
  } else if (duplicateStrategy === "skip") {
    await page.getByText(/Skip existing/i).click();
  }

  if (publishStatus === "active") {
    await page.getByText(/Active — visible on storefront/i).click();
  } else {
    await page.getByText(/Draft — import now/i).click();
  }

  await page.getByRole("button", { name: /Run validation preview/i }).click();

  const previewTable = page.locator('table[aria-label="Import preview"]');
  await previewTable.locator("tbody tr").first().waitFor({ state: "visible", timeout: 30_000 });

  await page
    .locator(".bulk-import-modal")
    .getByRole("button", { name: /Confirm import \(\d+\)/i })
    .click();
  await page
    .locator(".admin-confirm-dialog")
    .getByRole("button", { name: /Import now/i })
    .click();

  await page
    .locator(".bulk-import-modal")
    .getByText(/Import complete/i)
    .waitFor({
      state: "visible",
      timeout: 120_000,
    });

  await page
    .locator(".bulk-import-modal")
    .getByRole("button", { name: /^Done$/i })
    .click();
}

export async function confirmBulkImportViaApi(
  request: APIRequestContext,
  options: BulkImportWizardOptions & { imageCount?: number },
): Promise<{
  imported: number;
  updated: number;
  productId?: string;
  slug?: string;
  images?: string[];
}> {
  const {
    sku,
    productName,
    category,
    publishStatus = "draft",
    duplicateStrategy = "update",
    imageCount = 7,
  } = options;
  const csv = buildBulkImportCsvForSku(sku, productName, { category });
  const zip = buildSkuImageZip(sku, imageCount);

  const response = await request.post("/api/admin/products/import", {
    multipart: {
      file: {
        name: "bulk-import.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(csv),
      },
      zip: {
        name: "product-images.zip",
        mimeType: "application/zip",
        buffer: zip.toBuffer(),
      },
      options: JSON.stringify({ duplicateStrategy, publishStatus }),
      confirm: "true",
    },
  });

  if (!response.ok()) {
    throw new Error(`Bulk import confirm failed (${response.status()}): ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    result?: {
      imported?: number;
      updated?: number;
      products?: Array<{ id?: string; slug?: string; images?: string[] }>;
    };
  };

  const product = payload.result?.products?.[0];
  return {
    imported: payload.result?.imported ?? 0,
    updated: payload.result?.updated ?? 0,
    productId: product?.id,
    slug: product?.slug,
    images: product?.images,
  };
}

export async function deleteAdminProduct(
  request: APIRequestContext,
  productId: string,
): Promise<void> {
  await request.delete(`/api/admin/products/${productId}`, {
    headers: e2eMutationHeaders(),
  });
}

export async function findAdminProductIdBySku(
  request: APIRequestContext,
  sku: string,
): Promise<string | undefined> {
  const response = await request.get(
    `/api/admin/products?search=${encodeURIComponent(sku)}&limit=5`,
  );
  if (!response.ok()) return undefined;
  const payload = (await response.json()) as {
    products?: Array<{ id?: string; sku?: string }>;
  };
  return payload.products?.find((entry) => entry.sku === sku)?.id;
}
