import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/types/catalog";

const mockProduct = {
  id: "prod-l15-test",
  slug: "l15-test-guitar",
  name: "L15 Test Guitar",
  brand: "Vibe",
  category: "Guitars",
  subcategory: "Electric",
  price: 15000,
  originalPrice: 15000,
  discountPercentage: 0,
  rating: 4.5,
  reviewCount: 10,
  stock: 5,
  reservedStock: 0,
  lowStockThreshold: 2,
  sku: "L15-TEST",
  status: "active",
  featured: false,
  trending: false,
  newArrival: false,
  images: [],
  description: "Test product for L-15 price verification",
  specifications: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  brandSlug: "vibe",
  categorySlug: "guitars",
  availability: "in-stock",
  condition: "new",
  imageColor: "#000000",
  image: "",
  gstRate: 18,
} satisfies CatalogProduct;

vi.mock("@/lib/server/catalogRepository", () => ({
  loadProducts: vi.fn(() => [mockProduct]),
}));

vi.mock("@/services/catalogService", () => ({
  getProductsByIds: vi.fn(async () => []),
}));

vi.mock("@/lib/server/inventoryService", () => ({
  validateStockAvailability: vi.fn(async () => undefined),
}));

vi.mock("@/lib/server/variantService", () => ({
  getVariantFromProduct: vi.fn(() => null),
}));

import { resolveOrderItems } from "@/lib/server/orderValidation";

describe("resolveOrderItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces client-supplied prices with catalog unit prices", async () => {
    const resolved = await resolveOrderItems([
      {
        productId: mockProduct.id,
        quantity: 2,
        name: "Tampered Name",
      },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.price).toBe(15000);
    expect(resolved[0]?.quantity).toBe(2);
    expect(resolved[0]?.gstRate).toBe(18);
    expect(resolved[0]?.name).toBe("L15 Test Guitar");
  });

  it("derives gstRate from catalog category defaults, not client input", async () => {
    const noGstProduct: CatalogProduct = {
      ...mockProduct,
      id: "prod-no-gst",
      gstRate: undefined,
      category: "Guitars",
    };

    const { loadProducts } = await import("@/lib/server/catalogRepository");
    vi.mocked(loadProducts).mockReturnValueOnce([noGstProduct]);

    const resolved = await resolveOrderItems([
      {
        productId: noGstProduct.id,
        quantity: 1,
      },
    ]);

    expect(resolved[0]?.gstRate).toBe(18);
  });
});
