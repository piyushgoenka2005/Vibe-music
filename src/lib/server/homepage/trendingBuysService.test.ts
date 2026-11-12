import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CatalogProduct } from "@/types/catalog";
import type { HomepageSection, HomepageSectionItem } from "@/types/homepage";

const mockGetSectionByKey = vi.fn();
const mockListAllSectionItems = vi.fn();
const mockGetCachedHomepageProducts = vi.fn();
const mockGetTrendingProducts = vi.fn();

vi.mock("@/lib/server/homepageRepository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/homepageRepository")>();
  return {
    ...actual,
    getSectionByKey: (...args: unknown[]) => mockGetSectionByKey(...args),
    listAllSectionItems: (...args: unknown[]) => mockListAllSectionItems(...args),
  };
});

vi.mock("@/lib/server/catalogSnapshotCache", () => ({
  getCachedBrands: vi.fn().mockResolvedValue([]),
  getCachedCategories: vi.fn().mockResolvedValue([]),
  getCachedHomepageProducts: (...args: unknown[]) => mockGetCachedHomepageProducts(...args),
}));

vi.mock("@/lib/server/productRepository", () => ({
  getTrendingProducts: (...args: unknown[]) => mockGetTrendingProducts(...args),
}));

import { getTrendingBuysPublicData } from "@/lib/server/homepage/homepageService";
import { adminHomepageSectionSchema } from "@/lib/validations/admin";

function makeCatalogProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "prod-1",
    slug: "adeon-acm-24",
    name: "ADEON ACM-24 Gooseneck Microphone",
    brand: "ADEON",
    brandId: "brand-adeon",
    category: "Microphones",
    categorySlug: "microphones",
    description: "Gooseneck condenser mic",
    price: 4990,
    originalPrice: 5990,
    discountPercentage: 17,
    rating: 4.8,
    reviewCount: 15,
    inStock: true,
    stockCount: 5,
    featured: false,
    trending: true,
    newArrival: false,
    image: "/images/mic.webp",
    images: ["/images/mic.webp"],
    specs: {},
    status: "active",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSection(overrides: Partial<HomepageSection> = {}): HomepageSection {
  return {
    id: "trending_buys",
    sectionKey: "trending_buys",
    title: "Buy what's trending",
    subtitle: "In-stock gear other musicians are shopping right now.",
    accentLabel: "Trending now",
    ctaText: "Shop all trending",
    ctaLink: "/search/results?q=trending",
    secondaryCtaText: "View product",
    isActive: true,
    sortOrder: 16,
    sourceMode: "manual",
    maxItems: 3,
    layout: "product_grid",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getTrendingBuysPublicData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedHomepageProducts.mockResolvedValue([makeCatalogProduct()]);
    mockGetTrendingProducts.mockResolvedValue([]);
  });

  it("applies admin-edited section metadata and manual item overrides", async () => {
    mockGetSectionByKey.mockResolvedValue(
      makeSection({
        accentLabel: "Player Favorites",
        title: "Stage-ready picks",
        subtitle: "Handpicked gear ready for dispatch.",
        ctaText: "See all picks",
        ctaLink: "/deals",
        secondaryCtaText: "Inspect gear",
        maxItems: 4,
      }),
    );

    const manualItems: HomepageSectionItem[] = [
      {
        id: "item-1",
        sectionKey: "trending_buys",
        sortOrder: 1,
        isActive: true,
        productId: "prod-1",
        customTitle: "ADEON ACM-24 Studio Edition",
        badgeLabel: "Hot",
        offerText: "Ships same day",
        brandId: "ADEON Pro",
        createdAt: "2026-11-01T00:00:00.000Z",
        updatedAt: "2026-11-01T00:00:00.000Z",
      },
      {
        id: "item-2",
        sectionKey: "trending_buys",
        sortOrder: 2,
        isActive: true,
        customTitle: "Roland Custom Bundle",
        customHref: "/gp9",
        customImage: "/images/grand-piano-9.png",
        brandId: "Roland",
        badgeLabel: "Exclusive",
        offerText: "Store showcase unit",
        createdAt: "2026-11-01T00:00:00.000Z",
        updatedAt: "2026-11-01T00:00:00.000Z",
      },
    ];
    mockListAllSectionItems.mockResolvedValue(manualItems);

    const data = await getTrendingBuysPublicData(new Date("2026-11-12T10:00:00.000Z"));
    expect(data.isActive).toBe(true);
    expect(data.eyebrow).toBe("Player Favorites");
    expect(data.title).toBe("Stage-ready picks");
    expect(data.subtitle).toBe("Handpicked gear ready for dispatch.");
    expect(data.ctaText).toBe("See all picks");
    expect(data.ctaLink).toBe("/deals");
    expect(data.cardActionLabel).toBe("Inspect gear");
    expect(data.products).toHaveLength(2);
    expect(data.products[0]?.name).toBe("ADEON ACM-24 Studio Edition");
    expect(data.products[0]?.brand).toBe("ADEON Pro");
    expect(data.products[0]?.badgeLabel).toBe("Hot");
    expect(data.products[0]?.offerText).toBe("Ships same day");
    expect(data.products[1]?.name).toBe("Roland Custom Bundle");
    expect(data.products[1]?.brand).toBe("Roland");
  });

  it("hides section when admin disables isActive", async () => {
    mockGetSectionByKey.mockResolvedValue(makeSection({ isActive: false }));
    mockListAllSectionItems.mockResolvedValue([]);

    const data = await getTrendingBuysPublicData();
    expect(data.isActive).toBe(false);
    expect(data.products).toEqual([]);
  });

  it("supports clearing optional header text in admin", async () => {
    mockGetSectionByKey.mockResolvedValue(
      makeSection({
        accentLabel: undefined,
        subtitle: undefined,
        ctaText: undefined,
        ctaLink: undefined,
      }),
    );
    mockListAllSectionItems.mockResolvedValue([]);

    const data = await getTrendingBuysPublicData();
    expect(data.eyebrow).toBe("");
    expect(data.subtitle).toBe("");
    expect(data.ctaText).toBe("");
    expect(data.ctaLink).toBe("");
  });

  it("allows auto mode up to configured maxItems using catalog products", async () => {
    mockGetSectionByKey.mockResolvedValue(makeSection({ sourceMode: "auto", maxItems: 1 }));
    mockListAllSectionItems.mockResolvedValue([]);
    mockGetCachedHomepageProducts.mockResolvedValue([
      makeCatalogProduct({ id: "p1", name: "First Mic", trending: true }),
      makeCatalogProduct({ id: "p2", slug: "second", name: "Second Mixer", trending: true }),
    ]);

    const data = await getTrendingBuysPublicData();
    expect(data.isActive).toBe(true);
    expect(data.products).toHaveLength(1);
    expect(data.products[0]?.id).toBe("p1");
  });

  it("validates trending_buys payload in adminHomepageSectionSchema", () => {
    const parsed = adminHomepageSectionSchema.safeParse({
      title: "Trending Right Now",
      subtitle: "Fresh picks",
      accentLabel: "Hot",
      ctaText: "Shop trending",
      ctaLink: "/search/results?q=trending",
      secondaryCtaText: "Buy now",
      isActive: true,
      sourceMode: "auto",
      maxItems: 6,
      layout: "product_grid",
    });
    expect(parsed.success).toBe(true);
  });
});
