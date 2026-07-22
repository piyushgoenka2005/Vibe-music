import { describe, expect, it } from "vitest";
import {
  isBigNamesDealsGuitarProduct,
  resolveBigNamesDealFallbacks,
} from "@/lib/homepage/bigNamesDeals";
import type { CatalogProduct } from "@/types/catalog";

function guitar(partial: Partial<CatalogProduct> & Pick<CatalogProduct, "id" | "slug" | "name">): CatalogProduct {
  return {
    brand: "HERTZ",
    category: "Guitars",
    categorySlug: "guitars",
    price: 10000,
    status: "active",
    availability: "in-stock",
    condition: "new",
    image: "/x.webp",
    images: ["/x.webp"],
    rating: 4,
    reviewCount: 10,
    ...partial,
  } as CatalogProduct;
}

describe("resolveBigNamesDealFallbacks", () => {
  it("links each showcase brand to a distinct live guitar PDP", () => {
    const products = [
      guitar({
        id: "1",
        slug: "hertz-hza-3900-hza-3900",
        name: "HERTZ HZA-3900 Acoustic Guitar with Tobacco Sunburst",
      }),
      guitar({
        id: "2",
        slug: "hertz-hza-3600-hza-3600",
        name: "HERTZ HZA-3600 Natural Finish Acoustic Guitar",
      }),
      guitar({
        id: "3",
        slug: "hertz-hza4040-eq-hza4040-eq",
        name: "HERTZ HZA4040 EQ Solid Top Electro Acoustic Guitar with Natural Finish",
      }),
      guitar({
        id: "4",
        slug: "hertz-hza3900eq-hza3900eq",
        name: "HERTZ HZA3900EQ Electro Acoustic Guitar with Tobacco Sunburst",
      }),
      guitar({
        id: "5",
        slug: "hertz-hertz-hza-uk-24-hertz-hza-uk-24",
        name: "HERTZ HZA - UK(24) Professional Guitar",
      }),
      guitar({
        id: "amp",
        slug: "hertz-dg40-dg40",
        name: "HERTZ DG40 Guitar Amplifier",
        category: "Amplifiers",
        categorySlug: "amplifiers",
      }),
    ];

    const items = resolveBigNamesDealFallbacks(products);
    expect(items).toHaveLength(5);
    expect(items.every((item) => item.href.startsWith("/product/"))).toBe(true);
    expect(new Set(items.map((item) => item.href)).size).toBe(5);
    expect(items.some((item) => item.href.includes("dg40"))).toBe(false);
  });

  it("falls back to guitars category when catalog has no guitars", () => {
    const items = resolveBigNamesDealFallbacks([]);
    expect(items.every((item) => item.href === "/category/guitars")).toBe(true);
  });

  it("rejects amplifiers even when category looks like guitars", () => {
    expect(
      isBigNamesDealsGuitarProduct(
        guitar({
          id: "amp",
          slug: "amp",
          name: "HERTZ Guitar Amplifier",
          categorySlug: "guitars",
          category: "Guitars",
        })
      )
    ).toBe(false);
  });
});
