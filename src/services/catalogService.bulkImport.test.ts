import { describe, expect, it, vi, beforeEach } from "vitest";
import type { BulkImportRow } from "@/types/catalog";

vi.mock("@/lib/server/storeCatalogRepository", () => ({
  fetchExistingSlugsAndSkus: vi.fn(),
  fetchCategories: vi.fn(),
  fetchProductSkuIndex: vi.fn(),
  writeProduct: vi.fn(),
  fetchAllProducts: vi.fn(),
}));

vi.mock("@/lib/server/inventoryRepository", () => ({
  recordInventoryLogEntry: vi.fn(),
}));

import {
  fetchExistingSlugsAndSkus,
  fetchCategories,
  fetchProductSkuIndex,
} from "@/lib/server/storeCatalogRepository";
import { previewBulkImport } from "@/services/catalogService";

describe("previewBulkImport", () => {
  beforeEach(() => {
    vi.mocked(fetchExistingSlugsAndSkus).mockResolvedValue({
      slugs: new Set(["existing-product"]),
      skus: new Set(["EXISTING-SKU"]),
    });
    vi.mocked(fetchProductSkuIndex).mockResolvedValue(new Map([["EXISTING-SKU", "prod-existing"]]));
    vi.mocked(fetchCategories).mockResolvedValue([
      {
        id: "cat-guitars",
        slug: "guitars",
        name: "Guitars",
        description: "",
        imageUrl: "",
        isFeatured: true,
        sortOrder: 0,
        productCount: 0,
      },
      {
        id: "cat-studio",
        slug: "studio-recording",
        name: "Studio & Recording",
        description: "",
        imageUrl: "",
        isFeatured: true,
        sortOrder: 1,
        productCount: 0,
      },
      {
        id: "cat-mics",
        slug: "microphones-wireless",
        name: "Microphones & Wireless",
        description: "",
        imageUrl: "",
        isFeatured: true,
        sortOrder: 2,
        productCount: 0,
      },
    ]);
  });

  function amazonRow(overrides: Partial<BulkImportRow> = {}): BulkImportRow {
    return {
      name: "Test Guitar",
      brand: "Test Brand",
      category: "Guitars",
      price: 25000,
      originalPrice: 28000,
      sku: "TEST-SKU-001",
      sourceFormat: "vibemusic-bulk",
      ...overrides,
    };
  }

  it("accepts a valid vibemusic bulk row", async () => {
    const preview = await previewBulkImport([amazonRow()]);
    expect(preview).toHaveLength(1);
    expect(preview[0]?.valid).toBe(true);
    expect(preview[0]?.action).toBe("create");
  });

  it("rejects duplicate SKUs by default", async () => {
    const preview = await previewBulkImport([amazonRow({ sku: "EXISTING-SKU" })]);
    expect(preview[0]?.valid).toBe(false);
    expect(preview[0]?.errors.join(" ")).toMatch(/already exists in catalog/i);
  });

  it("marks existing SKUs as update when configured", async () => {
    const preview = await previewBulkImport([amazonRow({ sku: "EXISTING-SKU" })], {
      duplicateStrategy: "update",
      publishStatus: "active",
    });
    expect(preview[0]?.valid).toBe(true);
    expect(preview[0]?.action).toBe("update");
    expect(preview[0]?.existingProductId).toBe("prod-existing");
  });

  it("marks existing SKUs as skip when configured", async () => {
    const preview = await previewBulkImport([amazonRow({ sku: "EXISTING-SKU" })], {
      duplicateStrategy: "skip",
      publishStatus: "draft",
    });
    expect(preview[0]?.valid).toBe(true);
    expect(preview[0]?.action).toBe("skip");
  });

  it("rejects MRP lower than selling price", async () => {
    const preview = await previewBulkImport([amazonRow({ price: 30000, originalPrice: 25000 })]);
    expect(preview[0]?.valid).toBe(false);
    expect(preview[0]?.errors.join(" ")).toMatch(/MRP must be greater/i);
  });

  it("accepts MRP-only rows when Selling Price is blank", async () => {
    const preview = await previewBulkImport([
      amazonRow({
        price: 15999,
        originalPrice: 15999,
        priceFromMrpFallback: true,
      }),
    ]);
    expect(preview[0]?.valid).toBe(true);
    expect(preview[0]?.warnings?.join(" ")).toMatch(/using MRP as Selling Price/i);
  });

  it("resolves Zoom-style Musical Instruments rows via title inference", async () => {
    const preview = await previewBulkImport([
      amazonRow({
        name: "Zoom G1X FOUR Guitar Multi-Effects Processor with Expression Pedal",
        brand: "Zoom",
        category: "Musical Instruments",
        subcategory: "Guitar & Bass Accessories",
        price: 12999,
        originalPrice: 14999,
        sku: "VM-00050",
        specifications: {
          "Product Category": "Guitar Effects",
        },
      }),
    ]);
    expect(preview[0]?.valid).toBe(true);
    expect(preview[0]?.category).toBe("Studio & Recording");
    expect(preview[0]?.resolvedCategorySlug).toBe("studio-recording");
  });
});
