import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CatalogProduct } from "@/types/catalog";

vi.mock("@/lib/server/storeCatalogRepository", () => ({
  fetchProductById: vi.fn(),
  fetchAllProducts: vi.fn(),
  fetchCategories: vi.fn(),
  slugExists: vi.fn(),
  skuExists: vi.fn(),
  writeProduct: vi.fn(),
}));

vi.mock("@/lib/server/variantService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/variantService")>();
  return {
    ...actual,
    fetchAllVariantSkus: vi.fn(async () => new Set<string>()),
  };
});

import {
  fetchProductById,
  fetchAllProducts,
  writeProduct,
} from "@/lib/server/storeCatalogRepository";
import {
  buildGalleryFromImageUrls,
  resolveCatalogImageUrls,
  syncDefaultVariantPatch,
  updateProduct,
} from "@/services/catalogService";

const baseProduct: CatalogProduct = {
  id: "prod-1",
  slug: "boss-gx100",
  name: "BOSS GX-100",
  brand: "BOSS",
  category: "Studio & Recording",
  categorySlug: "studio-recording",
  subcategory: "",
  price: 12999,
  originalPrice: 14999,
  discountPercentage: 13,
  rating: 0,
  reviewCount: 0,
  stock: 5,
  sku: "VM-BOSS-GX100",
  status: "active",
  featured: false,
  trending: false,
  newArrival: false,
  images: ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"],
  description: "",
  specifications: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  brandSlug: "boss",
  availability: "in-stock",
  condition: "new",
  imageColor: "#e8e8e8",
  image: "https://cdn.example/a.jpg",
  detail: {
    msrp: null,
    salePrice: null,
    gallery: [
      { id: "img-0", alt: "old 1", color: "#e8e8e8", src: "https://cdn.example/a.jpg" },
      { id: "img-1", alt: "old 2", color: "#e8e8e8", src: "https://cdn.example/b.jpg" },
    ],
    specs: [],
    inTheBox: [],
    videos: [],
    variants: [],
    reviews: [],
    qa: [],
    frequentlyBoughtTogether: [],
    similarProductIds: [],
    relatedProductIds: [],
  },
};

describe("catalog product image updates", () => {
  beforeEach(() => {
    vi.mocked(fetchProductById).mockResolvedValue(baseProduct);
    vi.mocked(fetchAllProducts).mockResolvedValue([baseProduct]);
    vi.mocked(writeProduct).mockImplementation(async (product) => product);
  });

  it("syncs detail.gallery when images are removed", async () => {
    await updateProduct("prod-1", {
      images: ["https://cdn.example/a.jpg"],
    });

    expect(writeProduct).toHaveBeenCalledTimes(1);
    const saved = vi.mocked(writeProduct).mock.calls[0]?.[0];
    expect(saved?.images).toEqual(["https://cdn.example/a.jpg"]);
    expect(saved?.image).toBe("https://cdn.example/a.jpg");
    expect(saved?.detail?.gallery).toEqual(
      buildGalleryFromImageUrls({
        name: baseProduct.name,
        imageColor: baseProduct.imageColor,
        images: ["https://cdn.example/a.jpg"],
        image: "https://cdn.example/a.jpg",
      }),
    );
  });

  it("aligns single default variant rows with top-level price and stock", () => {
    const synced = syncDefaultVariantPatch(
      [
        {
          id: "var-default",
          label: "Standard",
          sku: "VM-BOSS-GX100",
          price: 12999,
          stock: 5,
          attributes: [],
          isDefault: true,
        },
      ],
      9999,
      12,
    );
    expect(synced[0]?.price).toBe(9999);
    expect(synced[0]?.stock).toBe(12);
  });

  it("resolves admin/storefront image lists from gallery when top-level images are empty", () => {
    const resolved = resolveCatalogImageUrls({
      ...baseProduct,
      images: [],
      image: "",
    });
    expect(resolved).toEqual(["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"]);
  });
});
