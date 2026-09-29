import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/catalogSnapshotCache", () => ({
  getCachedProducts: vi.fn(),
}));

import { getCachedProducts } from "@/lib/server/catalogSnapshotCache";
import { buildCategoryBentoCatalogMeta } from "@/lib/server/categoryBentoCatalog";

describe("buildCategoryBentoCatalogMeta", () => {
  beforeEach(() => {
    vi.mocked(getCachedProducts).mockResolvedValue([
      {
        id: "p1",
        name: "Guitar A",
        brand: "HERTZ",
        category: "Guitars",
        categorySlug: "guitars",
        status: "active",
        price: 10000,
        stock: 1,
        slug: "hertz-guitar-a",
        sku: "G1",
        image: "",
        images: [],
        availability: "in-stock",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p2",
        name: "Guitar B",
        brand: "HERTZ",
        category: "Guitars",
        categorySlug: "guitars",
        status: "active",
        price: 12000,
        stock: 1,
        slug: "hertz-guitar-b",
        sku: "G2",
        image: "",
        images: [],
        availability: "in-stock",
        createdAt: "",
        updatedAt: "",
      },
    ] as never);
  });

  it("derives brands and product counts from the live catalog", async () => {
    const meta = await buildCategoryBentoCatalogMeta();
    expect(meta.get("guitars")).toEqual({
      brands: "HERTZ",
      productCount: "2 products",
    });
  });
});
