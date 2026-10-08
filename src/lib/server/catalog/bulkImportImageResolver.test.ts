import AdmZip from "adm-zip";
import { describe, expect, it, vi } from "vitest";
import { getMaxBulkImportImages } from "@/lib/admin/bulkImportImages";
import { readBulkImportZipImageIndex } from "@/lib/admin/bulkImportZipImages";
import { E2E_TEST_JPEG } from "../../../../e2e/helpers/test-jpeg";

vi.mock("@/lib/server/platform/cdnImageOptimize", () => ({
  uploadOptimizedImageToCdn: vi.fn(async () => ({
    url: "http://localhost:3000/cdn-local/products/guitars/demo/uuid-w960.webp",
    masterUrl: "http://localhost:3000/cdn-local/products/guitars/demo/uuid.webp",
    derivatives: {},
  })),
}));

import {
  collectBulkImportImageNames,
  resolveBulkImportRowImages,
} from "@/lib/server/bulkImportImageResolver";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import type { BulkImportRow } from "@/types/catalog";

function buildZipIndex(files: Record<string, Buffer>) {
  const zip = new AdmZip();
  for (const [name, buffer] of Object.entries(files)) {
    zip.addFile(name, buffer);
  }
  return readBulkImportZipImageIndex(zip.toBuffer());
}

describe("bulkImportImageResolver", () => {
  const row: BulkImportRow = {
    name: "Preview Guitar",
    brand: "Brand",
    category: "Guitars",
    price: 1000,
    sku: "SKU-001",
    sourceFormat: "vibemusic-bulk",
  };

  it("records ZIP matches during preview without uploading", async () => {
    const zipIndex = buildZipIndex({ "sku-001.jpg": Buffer.from("img") });
    const resolved = await resolveBulkImportRowImages(row, zipIndex, false);
    expect(resolved.zipImageMatches).toEqual(["sku-001.jpg"]);
    expect(resolved.resolvedImages).toBeUndefined();
  });

  it("resolves all SKU-suffixed ZIP images up to the bulk import limit", async () => {
    const files: Record<string, Buffer> = {};
    for (let index = 1; index <= 7; index += 1) {
      files[`vm-boss-gx100_${index}.jpg`] = Buffer.from(`img-${index}`);
    }
    const zipIndex = buildZipIndex(files);

    const gxRow: BulkImportRow = {
      ...row,
      name: "BOSS GX-100 Guitar Effects Processor",
      sku: "VM-BOSS-GX100",
    };

    const resolved = await resolveBulkImportRowImages(gxRow, zipIndex, false);
    expect(resolved.zipImageMatches).toHaveLength(7);
    expect(resolved.zipImageMatches?.[0]).toBe("vm-boss-gx100_1.jpg");
    expect(resolved.zipImageMatches?.[6]).toBe("vm-boss-gx100_7.jpg");
  });

  it("imports every image inside a SKU-named folder", async () => {
    const zipIndex = buildZipIndex({
      "vm-boss-gx100/front.jpg": Buffer.from("front"),
      "vm-boss-gx100/side.jpg": Buffer.from("side"),
      "vm-boss-gx100/detail.jpg": Buffer.from("detail"),
    });

    const gxRow: BulkImportRow = {
      ...row,
      sku: "VM-BOSS-GX100",
    };

    const resolved = await resolveBulkImportRowImages(gxRow, zipIndex, false);
    expect(resolved.zipImageMatches).toEqual([
      "vm-boss-gx100/detail.jpg",
      "vm-boss-gx100/front.jpg",
      "vm-boss-gx100/side.jpg",
    ]);
  });

  it("deduplicates explicit image columns from SKU auto-matching", async () => {
    const zipIndex = buildZipIndex({
      "vm-boss-gx100_1.jpg": Buffer.from("one"),
      "vm-boss-gx100_2.jpg": Buffer.from("two"),
    });

    const gxRow: BulkImportRow = {
      ...row,
      sku: "VM-BOSS-GX100",
      image1: "VM-BOSS-GX100_1.jpg",
    };

    const resolved = await resolveBulkImportRowImages(gxRow, zipIndex, false);
    expect(collectBulkImportImageNames(gxRow)).toEqual(["VM-BOSS-GX100_1.jpg"]);
    expect(resolved.zipImageMatches).toEqual(["vm-boss-gx100_1.jpg", "vm-boss-gx100_2.jpg"]);
  });

  it("deduplicates duplicate explicit image column references", async () => {
    const zipIndex = buildZipIndex({ "dup.jpg": Buffer.from("one") });
    const dupRow: BulkImportRow = {
      ...row,
      image1: "dup.jpg",
      image2: "dup.jpg",
    };

    const resolved = await resolveBulkImportRowImages(dupRow, zipIndex, false);
    expect(resolved.zipImageMatches).toEqual(["dup.jpg"]);
  });

  it(`caps total resolved images at ${getMaxBulkImportImages()}`, async () => {
    const maxImages = getMaxBulkImportImages();
    const files: Record<string, Buffer> = {};
    for (let index = 1; index <= maxImages + 3; index += 1) {
      files[`sku-001_${index}.jpg`] = Buffer.from(`img-${index}`);
    }
    const zipIndex = buildZipIndex(files);

    const resolved = await resolveBulkImportRowImages(row, zipIndex, false);
    expect(resolved.zipImageMatches).toHaveLength(maxImages);
  });

  it("skips invalid ZIP image buffers during upload", async () => {
    const zipIndex = buildZipIndex({
      "valid.jpg": E2E_TEST_JPEG,
      "invalid.txt": Buffer.from("not-an-image"),
    });

    const resolved = await resolveBulkImportRowImages(
      { ...row, image1: "valid.jpg", image2: "invalid.txt" },
      zipIndex,
      true,
    );

    expect(uploadOptimizedImageToCdn).toHaveBeenCalledTimes(1);
    expect(resolved.resolvedImages).toHaveLength(1);
    expect(resolved.resolvedImages?.[0]).toMatch(/cdn-local|cdn\.vibemusic\.in/);
  });

  it("resolves spreadsheet paths that include folders", async () => {
    const zipIndex = buildZipIndex({
      "catalog/vm-001/front.jpg": E2E_TEST_JPEG,
    });

    const resolved = await resolveBulkImportRowImages(
      { ...row, sku: "VM-001", image1: "catalog/VM-001/front.jpg" },
      zipIndex,
      false,
    );

    expect(resolved.zipImageMatches).toEqual(["catalog/vm-001/front.jpg"]);
  });
});
