import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/types/catalog";
import {
  areMerchandisingPeersCompatible,
  getProductInstrumentKind,
  rankMerchandisingPeers,
} from "@/lib/product/productRelevance";

function makeProduct(
  overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "id" | "name">
): CatalogProduct {
  return {
    id: overrides.id,
    slug: overrides.slug ?? overrides.id,
    name: overrides.name,
    brand: overrides.brand ?? "HERTZ",
    category: overrides.category ?? "Guitars",
    subcategory: overrides.subcategory ?? "Acoustic Guitar",
    price: overrides.price ?? 7000,
    originalPrice: overrides.originalPrice ?? 8000,
    discountPercentage: overrides.discountPercentage ?? 12,
    rating: overrides.rating ?? 4.3,
    reviewCount: overrides.reviewCount ?? 100,
    stock: overrides.stock ?? 10,
    sku: overrides.sku ?? "VM-TEST",
    status: overrides.status ?? "active",
    featured: overrides.featured ?? false,
    trending: overrides.trending ?? false,
    newArrival: overrides.newArrival ?? false,
    images: overrides.images ?? [],
    description: overrides.description ?? "",
    specifications: overrides.specifications ?? {},
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-01-01T00:00:00.000Z",
    brandSlug: overrides.brandSlug ?? "hertz",
    categorySlug: overrides.categorySlug ?? "guitars",
    availability: overrides.availability ?? "in-stock",
    condition: overrides.condition ?? "new",
    imageColor: overrides.imageColor ?? "#fff",
    image: overrides.image ?? "",
  };
}

describe("productRelevance", () => {
  it("classifies acoustic guitars and guitar amps separately", () => {
    const acoustic = makeProduct({
      id: "acoustic",
      name: "HERTZ HZA-3600 Natural Finish Acoustic Guitar",
      subcategory: "Acoustic Guitar",
      sku: "VM-HZA3600",
    });
    const amp = makeProduct({
      id: "amp",
      name: "HERTZ DG20 Guitar Amplifier | Portable",
      subcategory: "Amplifier",
      sku: "VM-DG20",
    });

    expect(getProductInstrumentKind(acoustic)).toBe("acoustic-guitar");
    expect(getProductInstrumentKind(amp)).toBe("amplifier");
    expect(areMerchandisingPeersCompatible(acoustic, amp)).toBe(false);
  });

  it("ranks same-subcategory acoustic guitars above amps for an acoustic PDP", () => {
    const source = makeProduct({
      id: "source",
      name: "HERTZ HZA-3600 Natural Finish Acoustic Guitar",
      subcategory: "Acoustic Guitar",
      sku: "VM-HZA3600",
      price: 7623,
    });
    const amp = makeProduct({
      id: "amp",
      name: "HERTZ DG20 Guitar Amplifier | Portable",
      subcategory: "Amplifier",
      sku: "VM-DG20",
      price: 5340,
    });
    const sibling = makeProduct({
      id: "sibling",
      name: "HERTZ HZA-3900 Acoustic Guitar",
      subcategory: "Acoustic Guitar",
      sku: "VM-HZA3900",
      price: 7100,
    });

    const ranked = rankMerchandisingPeers(
      source,
      [amp, sibling],
      4,
      "related"
    );

    expect(ranked.map((product) => product.id)).toEqual(["sibling"]);
  });
});
