import { describe, expect, it } from "vitest";
import {
  isBigNamesDealsGuitarProduct,
  resolveBigNamesDealFallbacks,
} from "@/lib/homepage/bigNamesDeals";
import type { CatalogProduct } from "@/types/catalog";

function guitar(
  partial: Partial<CatalogProduct> & Pick<CatalogProduct, "id" | "slug" | "name">
): CatalogProduct {
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
  it("always deep-links each showcase guitar to a product PDP", () => {
    const items = resolveBigNamesDealFallbacks([]);
    expect(items).toHaveLength(5);
    expect(items.every((item) => item.href.startsWith("/product/"))).toBe(true);
    expect(items.some((item) => item.href.includes("/category/"))).toBe(false);
    expect(items.some((item) => item.href.includes("/search"))).toBe(false);
  });

  it("prefers configured product slugs when present in catalog", () => {
    const products = [
      guitar({
        id: "1",
        slug: "hertz-hertz-hza-uk-24-hertz-hza-uk-24",
        name: "HERTZ HZA - UK(24) Professional Guitar",
      }),
      guitar({
        id: "2",
        slug: "hertz-hza-3900-hza-3900",
        name: "HERTZ HZA-3900 Acoustic Guitar with Tobacco Sunburst",
      }),
      guitar({
        id: "3",
        slug: "hertz-hza-3600-hza-3600",
        name: "HERTZ HZA-3600 Natural Finish Acoustic Guitar",
      }),
      guitar({
        id: "4",
        slug: "hertz-hza3900eq-hza3900eq",
        name: "HERTZ HZA3900EQ Electro Acoustic Guitar",
      }),
      guitar({
        id: "5",
        slug: "hertz-hza-4060-hza-4060",
        name: "HERTZ HZA-4060 Solid Top Acoustic Guitar",
      }),
    ];

    const items = resolveBigNamesDealFallbacks(products);
    expect(items.map((item) => item.href)).toEqual([
      "/product/hertz-hertz-hza-uk-24-hertz-hza-uk-24",
      "/product/hertz-hza-3900-hza-3900",
      "/product/hertz-hza-3600-hza-3600",
      "/product/hertz-hza3900eq-hza3900eq",
      "/product/hertz-hza-4060-hza-4060",
    ]);
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
