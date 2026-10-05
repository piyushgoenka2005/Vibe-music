import { describe, expect, it } from "vitest";
import {
  isBigNamesDealsGuitarProduct,
  mapCatalogProductToBigNamesDeal,
  resolveBigNamesDealFallbacks,
} from "@/lib/homepage/bigNamesDeals";
import { BIG_NAMES_DEALS } from "@/data/bigNamesDeals";
import type { CatalogProduct } from "@/types/catalog";

function guitar(
  partial: Partial<CatalogProduct> & Pick<CatalogProduct, "id" | "slug" | "name">,
): CatalogProduct {
  return {
    brand: "HERTZ",
    brandSlug: "hertz",
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
        image:
          "https://cdn.vibemusic.in/products/guitars/hertz-hertz-hza-uk-24-hertz-hza-uk-24/live.png",
      }),
      guitar({
        id: "2",
        slug: "hertz-hza-3900-hza-3900",
        name: "HERTZ HZA-3900 Acoustic Guitar with Tobacco Sunburst",
        image: "https://cdn.vibemusic.in/products/guitars/hertz-hza-3900-hza-3900/live.png",
      }),
      guitar({
        id: "3",
        slug: "hertz-hza-3600-hza-3600",
        name: "HERTZ HZA-3600 Natural Finish Acoustic Guitar",
        image: "https://cdn.vibemusic.in/products/guitars/hertz-hza-3600-hza-3600/live.png",
      }),
      guitar({
        id: "4",
        slug: "hertz-hza3900eq-hza3900eq",
        name: "HERTZ HZA3900EQ Electro Acoustic Guitar",
        image: "https://cdn.vibemusic.in/products/guitars/hertz-hza3900eq-hza3900eq/live.png",
      }),
      guitar({
        id: "5",
        slug: "hertz-hza-6000-hza-6000",
        name: "HERTZ HZA-6000 Acoustic Guitar",
        image: "https://cdn.vibemusic.in/products/guitars/hertz-hza-6000-hza-6000/live.png",
      }),
    ];

    const items = resolveBigNamesDealFallbacks(products);
    expect(items.map((item) => item.href)).toEqual([
      "/product/hertz-hertz-hza-uk-24-hertz-hza-uk-24",
      "/product/hertz-hza-3900-hza-3900",
      "/product/hertz-hza-3600-hza-3600",
      "/product/hertz-hza3900eq-hza3900eq",
      "/product/hertz-hza-6000-hza-6000",
    ]);
    expect(items.every((item) => item.product.includes("cdn.vibemusic.in"))).toBe(true);
    expect(items.every((item) => item.brand === "HERTZ")).toBe(true);
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
        }),
      ),
    ).toBe(false);
  });

  it("uses vertical packshot with multiply blend when HZA-6000 has no standing lifestyle art", () => {
    const products = [
      guitar({
        id: "5",
        slug: "hertz-hza-6000-hza-6000",
        name: "HERTZ HZA-6000 Acoustic Guitar",
        image:
          "https://cdn.vibemusic.in/products/guitars/hertz-hza-6000-hza-6000/0c482bf6-3921-4e88-b9b4-b13b3031012d.png",
        images: [
          "https://cdn.vibemusic.in/products/guitars/hertz-hza-6000-hza-6000/0c482bf6-3921-4e88-b9b4-b13b3031012d.png",
          "https://cdn.vibemusic.in/products/guitars/hertz-hza-6000-hza-6000/7eb0b094-9d3b-48c2-8c15-32d959ab7ce3.png",
        ],
      }),
    ];

    const items = resolveBigNamesDealFallbacks(products);
    expect(items[0]?.product).toContain("0c482bf6-3921-4e88-b9b4-b13b3031012d.png");
    expect(items[0]?.product).not.toContain("7eb0b094-9d3b-48c2-8c15-32d959ab7ce3.png");
    expect(items[0]?.blendMultiply).toBe(true);
  });

  it("uses catalog CDN images instead of hardcoded showcase art", () => {
    const products = BIG_NAMES_DEALS.map((deal, index) =>
      guitar({
        id: String(index + 1),
        slug: deal.productSlug,
        name: deal.productAlt,
        image: `https://cdn.vibemusic.in/products/guitars/${deal.productSlug}/live.png`,
      }),
    );

    const items = resolveBigNamesDealFallbacks(products);
    expect(items.every((item) => item.product.includes("cdn.vibemusic.in"))).toBe(true);
    expect(items.every((item) => !item.product.includes("/images/big-names-deals/"))).toBe(true);
  });

  it("uses catalog images for admin-picked products", () => {
    const item = mapCatalogProductToBigNamesDeal(
      guitar({
        id: "unknown",
        slug: "hertz-random-acoustic-guitar",
        name: "Random Hertz guitar",
        image: "https://cdn.vibemusic.in/products/guitars/example/live.png",
      }),
      { slotIndex: 2 },
    );

    expect(item.product).toContain("cdn.vibemusic.in");
    expect(item.brand).toBe("HERTZ");
    expect(item.href).toBe("/product/hertz-random-acoustic-guitar");
  });

  it("falls back to static showcase art only when catalog is empty", () => {
    const items = resolveBigNamesDealFallbacks([]);
    expect(items.every((item) => item.product.includes("/images/big-names-deals/"))).toBe(true);
  });
});
