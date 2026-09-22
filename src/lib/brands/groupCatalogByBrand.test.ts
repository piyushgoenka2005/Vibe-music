import { describe, expect, it } from "vitest";
import { brandIndexLetter, groupCatalogByBrand } from "@/lib/brands/groupCatalogByBrand";
import type { CatalogProduct } from "@/types/catalog";

function product(
  partial: Partial<CatalogProduct> &
    Pick<CatalogProduct, "id" | "slug" | "name" | "brand" | "brandSlug">,
): CatalogProduct {
  return {
    category: "guitars",
    categorySlug: "guitars",
    subcategory: "",
    price: 1000,
    originalPrice: 1000,
    discountPercentage: 0,
    rating: 0,
    reviewCount: 0,
    stock: 1,
    sku: partial.id,
    status: "active",
    featured: false,
    trending: false,
    newArrival: false,
    description: "",
    image: "/images/guitar-1.webp",
    images: [],
    imageColor: "#eee",
    specifications: {},
    availability: "in-stock",
    condition: "new",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("groupCatalogByBrand", () => {
  it("indexes letters and groups active products by brand slug", () => {
    expect(brandIndexLetter("Nord")).toBe("N");
    expect(brandIndexLetter("123 Audio")).toBe("#");

    const groups = groupCatalogByBrand(
      [
        product({
          id: "1",
          slug: "nord-a",
          name: "Stage Piano",
          brand: "Nord",
          brandSlug: "nord",
        }),
        product({
          id: "2",
          slug: "hertz-a",
          name: "Acoustic",
          brand: "HERTZ",
          brandSlug: "hertz",
          status: "draft",
        }),
      ],
      [{ id: "nord", name: "Nord", slug: "nord" }],
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.slug).toBe("nord");
    expect(groups[0]?.letter).toBe("N");
    expect(groups[0]?.products).toHaveLength(1);
  });
});
