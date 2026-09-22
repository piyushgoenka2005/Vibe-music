import { describe, expect, it } from "vitest";
import { resolveBulkImportRowImages } from "@/lib/server/bulkImportImageResolver";
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
});
