import { describe, expect, it } from "vitest";
import type { BulkImportRow } from "@/types/catalog";
import type { Category } from "@/types/category";
import {
  collectBulkImportCategoryCandidates,
  inferBulkImportCategorySlug,
  isGenericBulkCategoryValue,
  pickBulkImportCategoryLabel,
  resolveBulkImportCategory,
} from "@/lib/admin/bulkImportCategoryResolver";

const categories: Category[] = [
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
  {
    id: "cat-accessories",
    slug: "cables-cases-accessories",
    name: "Cables, Cases & Accessories",
    description: "",
    imageUrl: "",
    isFeatured: true,
    sortOrder: 3,
    productCount: 0,
  },
];

function zoomRow(overrides: Partial<BulkImportRow> = {}): BulkImportRow {
  return {
    name: "Zoom G1X FOUR Guitar Multi-Effects Processor with Expression Pedal",
    brand: "Zoom",
    category: "Musical Instruments",
    subcategory: "Guitar & Bass Accessories",
    price: 12999,
    sku: "VM-00050",
    sourceFormat: "vibemusic-bulk",
    specifications: {
      "Product Category": "Guitar Effects",
      "Product Type": "Multi-Effects Processor",
    },
    ...overrides,
  };
}

describe("bulkImportCategoryResolver", () => {
  it("treats Musical Instruments as generic", () => {
    expect(isGenericBulkCategoryValue("Musical Instruments")).toBe(true);
    expect(isGenericBulkCategoryValue("Guitars")).toBe(false);
  });

  it("prefers specific listing columns over generic Category", () => {
    expect(pickBulkImportCategoryLabel(zoomRow())).toBe("Guitar & Bass Accessories");
    expect(collectBulkImportCategoryCandidates(zoomRow())[0]).toBe("Guitar & Bass Accessories");
  });

  it("infers studio-recording for guitar multi-effects titles", () => {
    expect(inferBulkImportCategorySlug(zoomRow().name)).toBe("studio-recording");
  });

  it("resolves Zoom rows via title inference when catalog labels do not match", () => {
    const resolved = resolveBulkImportCategory(categories, zoomRow());
    expect(resolved.category?.slug).toBe("studio-recording");
    expect(resolved.inferredFromTitle).toBe(true);
  });

  it("resolves accessory packs to cables-cases-accessories", () => {
    const resolved = resolveBulkImportCategory(
      categories,
      zoomRow({
        name: "Zoom SPH-1n Accessory Pack for Zoom H1n Handy Recorder",
        subcategory: "Recorder Accessories",
      }),
    );
    expect(resolved.category?.slug).toBe("cables-cases-accessories");
  });

  it("resolves microphones from product title", () => {
    const resolved = resolveBulkImportCategory(
      categories,
      zoomRow({
        name: "Zoom SGV-6 Super Cardioid Shotgun Vocal Microphone",
        subcategory: "Microphones",
      }),
    );
    expect(resolved.category?.slug).toBe("microphones-wireless");
  });
});
