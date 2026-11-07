import { describe, it, expect } from "vitest";
import {
  adminProductSchema,
  adminProductBulkSchema,
  adminProductBundleSchema,
} from "@/lib/validations/admin";
import {
  validateSpreadsheetFile,
  MAX_SHEET_BYTES,
  MAX_IMPORT_ROWS,
} from "@/lib/admin/bulkImportValidation";
import { createEmptyBundleState } from "@/components/admin/ProductBundleEditor";

describe("Tier 1: Admin Products CRUD & Bulk Import", () => {
  it("validates full admin product creation payload including variants and HSN tax rate", () => {
    const validProduct = {
      slug: "roland-fp30x-digital-piano",
      name: "Roland FP-30X 88-Key Digital Piano",
      brand: "Roland",
      brandSlug: "roland",
      category: "Keyboards & Pianos",
      categorySlug: "keyboards",
      subcategory: "Digital Pianos",
      price: 64990,
      originalPrice: 72000,
      sku: "ROL-FP30X-BK",
      gstRate: 18,
      stockQuantity: 15,
      availability: "in-stock" as const,
      condition: "new" as const,
      status: "active" as const,
      description: "SuperNATURAL Piano sound engine with 88-note PHA-4 Standard keyboard.",
      featured: true,
      variants: [
        {
          sku: "ROL-FP30X-BK",
          label: "Black",
          price: 64990,
          stock: 10,
          isDefault: true,
          attributes: [{ type: "color", name: "Color", value: "Black" }],
        },
        {
          sku: "ROL-FP30X-WH",
          label: "White",
          price: 64990,
          stock: 5,
          attributes: [{ type: "color", name: "Color", value: "White" }],
        },
      ],
    };

    const result = adminProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("permits ₹0 price for Coming Soon / unreleased products but rejects negative price", () => {
    const comingSoonProduct = {
      slug: "upcoming-synth-2027",
      name: "Next-Gen Polyphonic Analog Synthesizer",
      brand: "Moog",
      category: "Keyboards & Pianos",
      price: 0, // ₹0 allowed for coming soon
    };
    expect(adminProductSchema.safeParse(comingSoonProduct).success).toBe(true);

    const negativePriceProduct = {
      ...comingSoonProduct,
      price: -500,
    };
    expect(adminProductSchema.safeParse(negativePriceProduct).success).toBe(false);
  });

  it("validates admin product bulk actions (update_stock, update_category, archive, delete)", () => {
    // Stock update action
    const stockUpdate = {
      action: "update_stock" as const,
      ids: ["prod-1", "prod-2"],
      stock: 50,
    };
    expect(adminProductBulkSchema.safeParse(stockUpdate).success).toBe(true);

    // Category update action
    const categoryUpdate = {
      action: "update_category" as const,
      ids: ["prod-1"],
      category: "Electric Guitars",
      categorySlug: "electric-guitars",
    };
    expect(adminProductBulkSchema.safeParse(categoryUpdate).success).toBe(true);

    // Archive action
    const archiveAction = {
      action: "archive" as const,
      ids: ["prod-1"],
    };
    expect(adminProductBulkSchema.safeParse(archiveAction).success).toBe(true);

    // Delete action
    const deleteAction = {
      action: "delete" as const,
      ids: ["prod-1"],
    };
    expect(adminProductBulkSchema.safeParse(deleteAction).success).toBe(true);

    // Invalid action
    const invalidAction = {
      action: "unknown_action",
      ids: ["prod-1"],
    };
    expect(adminProductBulkSchema.safeParse(invalidAction).success).toBe(false);
  });

  it("validates bulk import spreadsheet file constraints and row limits", () => {
    expect(MAX_IMPORT_ROWS).toBe(2000);
    expect(MAX_SHEET_BYTES).toBe(25 * 1024 * 1024); // 25 MB

    // Simulated valid CSV file
    const validCsvFile = {
      name: "products_import.csv",
      size: 1024 * 50, // 50 KB
      type: "text/csv",
    } as unknown as File;
    expect(validateSpreadsheetFile(validCsvFile)).toBeNull();

    // Simulated empty file (0 bytes)
    const emptyFile = {
      name: "empty.csv",
      size: 0,
      type: "text/csv",
    } as unknown as File;
    expect(validateSpreadsheetFile(emptyFile)).toContain("empty");

    // Simulated oversized file (> 25MB)
    const hugeFile = {
      name: "huge.xlsx",
      size: 30 * 1024 * 1024,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    } as unknown as File;
    expect(validateSpreadsheetFile(hugeFile)).toContain("at most");
  });

  it("validates product merchandising bundle configuration (Feature 17)", () => {
    const emptyState = createEmptyBundleState();
    expect(emptyState.relatedProductIds).toEqual([]);
    expect(emptyState.discountPercent).toBeGreaterThan(0);
    expect(emptyState.isActive).toBe(true);

    const validBundlePayload = {
      relatedProductIds: ["prod-fender-strat", "prod-yamaha-p125"],
      discountPercent: 15,
      isActive: true,
      productName: "Studio Essentials Bundle",
      productSlug: "studio-essentials-bundle",
    };
    expect(adminProductBundleSchema.safeParse(validBundlePayload).success).toBe(true);

    // Rejects bundle with > 6 related products
    const excessiveBundle = {
      ...validBundlePayload,
      relatedProductIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"],
    };
    expect(adminProductBundleSchema.safeParse(excessiveBundle).success).toBe(false);
  });
});
