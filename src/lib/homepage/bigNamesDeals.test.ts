import { describe, expect, it } from "vitest";
import {
  isBigNamesDealsGuitarProduct,
  mapCatalogProductToBigNamesDeal,
  resolveBigNamesDealFallbacks,
  resolveBigNamesShowcaseImage,
} from "@/lib/homepage/bigNamesDeals";
import { BIG_NAMES_DEALS } from "@/data/bigNamesDeals";
import type { CatalogProduct } from "@/types/catalog";

function guitar(
  partial: Partial<CatalogProduct> & Pick<CatalogProduct, "id" | "slug" | "name">,
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
        slug: "hertz-hza-6000-hza-6000",
        name: "HERTZ HZA-6000 Acoustic Guitar",
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

  it("prefers self-hosted showcase art when catalog image is on CDN", () => {
    const deal = BIG_NAMES_DEALS[0]!;
    const image = resolveBigNamesShowcaseImage(
      "https://cdn.vibemusic.in/products/guitars/example/missing.png",
      deal,
      guitar({
        id: "1",
        slug: deal.productSlug,
        name: "HERTZ showcase guitar",
        image: "https://cdn.vibemusic.in/products/guitars/example/missing.png",
      }),
    );
    expect(image.startsWith("/images/")).toBe(true);
    expect(image).not.toContain("cdn.vibemusic.in");
    expect(image).toBe(deal.product);
  });

  it("ignores generic local product thumbnails for configured showcase slots", () => {
    const deal = BIG_NAMES_DEALS[0]!;
    const image = resolveBigNamesShowcaseImage(
      "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png",
      deal,
      guitar({
        id: "1",
        slug: deal.productSlug,
        name: "HERTZ showcase guitar",
      }),
    );
    expect(image).toBe(deal.product);
  });

  it("uses distinct showcase art for each configured deal slot", () => {
    const products = BIG_NAMES_DEALS.map((deal, index) =>
      guitar({
        id: String(index + 1),
        slug: deal.productSlug,
        name: deal.productAlt,
        image: "https://cdn.vibemusic.in/products/guitars/example/missing.png",
      }),
    );

    const items = resolveBigNamesDealFallbacks(products);
    expect(new Set(items.map((item) => item.product)).size).toBe(5);
    expect(items.every((item) => item.product.includes("/images/big-names-deals/"))).toBe(true);
  });

  it("uses slot art for admin-picked products that do not match deal slugs", () => {
    const item = mapCatalogProductToBigNamesDeal(
      guitar({
        id: "unknown",
        slug: "hertz-random-acoustic-guitar",
        name: "Random Hertz guitar",
        image: "https://cdn.vibemusic.in/products/guitars/example/live.png",
      }),
      { slotIndex: 2 },
    );

    expect(item.product).toBe(BIG_NAMES_DEALS[2]!.product);
    expect(item.product).not.toContain("cdn.vibemusic.in");
  });
});
