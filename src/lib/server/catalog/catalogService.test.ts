import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/types/catalog";
import { searchInCatalogProducts } from "./catalogService";

function product(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "product-1",
    slug: "product-1",
    name: "Product",
    brand: "Brand",
    category: "Guitars",
    subcategory: "Bass Amplifiers",
    price: 1000,
    originalPrice: 1000,
    discountPercentage: 0,
    rating: 0,
    reviewCount: 0,
    stock: 10,
    sku: "SKU-1",
    status: "active",
    featured: false,
    trending: false,
    newArrival: false,
    images: [],
    description: "",
    specifications: {},
    createdAt: "",
    updatedAt: "",
    brandSlug: "brand",
    categorySlug: "guitars",
    availability: "in-stock",
    condition: "new",
    imageColor: "",
    image: "",
    ...overrides,
  };
}

describe("searchInCatalogProducts", () => {
  it("matches a child category slug against the stored subcategory name", () => {
    const results = searchInCatalogProducts([product()], {
      category: "guitars",
      subcategory: "bass-amplifiers",
    });

    expect(results).toHaveLength(1);
  });

  it("does not return products from a different child category", () => {
    const results = searchInCatalogProducts([product()], {
      category: "guitars",
      subcategory: "electric-guitars",
    });

    expect(results).toHaveLength(0);
  });
});
