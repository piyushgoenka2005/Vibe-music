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

  it("accurately searches instrument cables and synonyms without false positives", () => {
    const cable1 = product({
      id: "cable-1",
      name: "HERTZ HZ CBL12 Instrument Cable | 10-Meter Reach | Black",
      category: "Cables",
      categorySlug: "cables",
      subcategory: "Guitar & Instrument Cables",
    });
    const cable2 = product({
      id: "cable-2",
      name: "HERTZ HZCD-8021 Guitar Cable | 6-Meter Connection | Black",
      category: "Cables",
      categorySlug: "cables",
      subcategory: "Guitar & Instrument Cables",
    });
    const xlrCable = product({
      id: "cable-3",
      name: "Hertz HZCD-8021 3-Meter XLR Audio Cable | Balanced Audio Connectivity | Black",
      category: "Cables",
      categorySlug: "cables",
      subcategory: "XLR Microphone & Audio Cables",
    });
    const percussion = product({
      id: "perc-1",
      name: "AVUS CLAPSTA Hand Clap Percussion Instrument – Studio Recording Rhythm Clapper",
      category: "Drums & Percussion",
      categorySlug: "drums-percussion",
      subcategory: "Hand Percussion Instruments",
    });

    const catalog = [cable1, cable2, xlrCable, percussion];

    // Searching "instrument cable" matches instrument cable and guitar cable synonym, but NOT percussion or XLR
    const instrumentResults = searchInCatalogProducts(catalog, { query: "instrument cable" });
    const instrumentIds = instrumentResults.map((p) => p.id);
    expect(instrumentIds).toContain("cable-1");
    expect(instrumentIds).toContain("cable-2");
    expect(instrumentIds).not.toContain("perc-1");
    expect(instrumentIds).not.toContain("cable-3");

    // Searching "xlr cable" matches only the XLR cable
    const xlrResults = searchInCatalogProducts(catalog, { query: "xlr cable" });
    const xlrIds = xlrResults.map((p) => p.id);
    expect(xlrIds).toEqual(["cable-3"]);
  });
});
