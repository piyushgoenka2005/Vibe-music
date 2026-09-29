import { describe, expect, it } from "vitest";
import { getMaxBulkImportImages } from "@/lib/admin/bulkImportImages";
import {
  collectBulkImportImageNames,
  resolveBulkImportRowImages,
} from "@/lib/server/bulkImportImageResolver";
import type { BulkImportRow } from "@/types/catalog";

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
    const zipMap = new Map<string, Buffer>([["sku-001.jpg", Buffer.from("img")]]);
    const resolved = await resolveBulkImportRowImages(row, zipMap, false);
    expect(resolved.zipImageMatches).toEqual(["sku-001.jpg"]);
    expect(resolved.resolvedImages).toBeUndefined();
  });

  it("resolves all SKU-suffixed ZIP images up to the bulk import limit", async () => {
    const zipMap = new Map<string, Buffer>();
    for (let index = 1; index <= 7; index += 1) {
      zipMap.set(`vm-boss-gx100_${index}.jpg`, Buffer.from(`img-${index}`));
    }

    const gxRow: BulkImportRow = {
      ...row,
      name: "BOSS GX-100 Guitar Effects Processor",
      sku: "VM-BOSS-GX100",
    };

    const resolved = await resolveBulkImportRowImages(gxRow, zipMap, false);
    expect(resolved.zipImageMatches).toHaveLength(7);
    expect(resolved.zipImageMatches?.[0]).toBe("vm-boss-gx100_1.jpg");
    expect(resolved.zipImageMatches?.[6]).toBe("vm-boss-gx100_7.jpg");
  });

  it("deduplicates explicit image columns from SKU auto-matching", async () => {
    const zipMap = new Map<string, Buffer>([
      ["vm-boss-gx100_1.jpg", Buffer.from("one")],
      ["vm-boss-gx100_2.jpg", Buffer.from("two")],
    ]);

    const gxRow: BulkImportRow = {
      ...row,
      sku: "VM-BOSS-GX100",
      image1: "VM-BOSS-GX100_1.jpg",
    };

    const resolved = await resolveBulkImportRowImages(gxRow, zipMap, false);
    expect(collectBulkImportImageNames(gxRow)).toEqual(["VM-BOSS-GX100_1.jpg"]);
    expect(resolved.zipImageMatches).toEqual(["VM-BOSS-GX100_1.jpg", "vm-boss-gx100_2.jpg"]);
  });

  it("deduplicates duplicate explicit image column references", async () => {
    const zipMap = new Map<string, Buffer>([["dup.jpg", Buffer.from("one")]]);
    const dupRow: BulkImportRow = {
      ...row,
      image1: "dup.jpg",
      image2: "dup.jpg",
    };

    const resolved = await resolveBulkImportRowImages(dupRow, zipMap, false);
    expect(resolved.zipImageMatches).toEqual(["dup.jpg"]);
  });

  it(`caps total resolved images at ${getMaxBulkImportImages()}`, async () => {
    const maxImages = getMaxBulkImportImages();
    const zipMap = new Map<string, Buffer>();
    for (let index = 1; index <= maxImages + 3; index += 1) {
      zipMap.set(`sku-001_${index}.jpg`, Buffer.from(`img-${index}`));
    }

    const resolved = await resolveBulkImportRowImages(row, zipMap, false);
    expect(resolved.zipImageMatches).toHaveLength(maxImages);
  });
});
