import "server-only";

import { fetchBrands } from "@/lib/server/storeCatalogRepository";
import { getCachedActiveProducts } from "@/lib/server/catalogSnapshotCache";
import { listCategories } from "@/lib/server/categoryRepository";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { buildTopBrandStripItems } from "@/data/topBrandStrip";
import { getCategoryGridImage } from "@/lib/categoryImages";
import { categoryPath, productPath } from "@/lib/routes";
import { ensureProductReviewMetrics } from "@/lib/product/productReviewDisplay";
import {
  getSectionByKey,
  listActiveSections,
  listAllSectionItems,
  isHomepageItemScheduledActive,
} from "@/lib/server/homepageRepository";
import { getHomepageStaticFallbacks } from "@/data/homepageStaticFallbacks";
import {
  getHomepagePopularCategoryItems,
  HOMEPAGE_POPULAR_CATEGORY_COUNT,
} from "@/data/popularCategories";
import { DEFAULT_HOMEPAGE_SECTIONS } from "@/types/homepage";
import {
  BIG_NAMES_DEALS_CTA,
} from "@/data/bigNamesDeals";
import {
  BIG_NAMES_DEALS_MAX_ITEMS,
  isBigNamesDealsGuitarProduct,
  mapCatalogProductToBigNamesDeal,
  resolveBigNamesDealFallbacks,
} from "@/lib/homepage/bigNamesDeals";
import type { CatalogProduct } from "@/types/catalog";
import type {
  HomepageBrandItem,
  HomepageCategoryItem,
  HomepageProductItem,
  HomepageSection,
  HomepageSectionItem,
  HomepageSectionKey,
  PublicBigNamesDealsData,
  PublicHomepageData,
  ResolvedHomepageSection,
} from "@/types/homepage";

export function invalidatePublicHomepageCache(): void {
  void import("@/lib/server/homepageSnapshotCache").then(({ revalidateHomepageSnapshot }) =>
    revalidateHomepageSnapshot()
  );
}

function activeProducts(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((product) => product.status === "active");
}

function toProductItem(
  product: CatalogProduct,
  overrides?: Partial<HomepageSectionItem>,
  rank?: number
): HomepageProductItem {
  const hasDiscount =
    product.originalPrice > product.price && product.price > 0;
  const salePrice = hasDiscount ? product.price : null;
  const variantCount = product.detail?.variants?.length ?? 0;
  const { rating, reviewCount } = ensureProductReviewMetrics({
    id: product.id,
    rating: product.rating,
    reviewCount: product.reviewCount,
  });
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    price: hasDiscount ? product.originalPrice : product.price,
    salePrice,
    image: product.image || product.images[0] || "",
    imageAlt: product.name,
    rating,
    reviewCount,
    href: productPath(product.slug),
    badgeLabel: overrides?.badgeLabel,
    offerText: overrides?.offerText,
    rank,
    requiresVariantSelection: variantCount > 1,
  };
}

function resolveManualProducts(
  items: HomepageSectionItem[],
  products: CatalogProduct[]
): HomepageProductItem[] {
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items
    .map((item, index) => {
      if (!item.productId) return null;
      const product = productMap.get(item.productId);
      if (!product || product.status !== "active" || product.price <= 0) return null;
      return toProductItem(product, item, index + 1);
    })
    .filter((item): item is HomepageProductItem => item !== null);
}

function resolveAutoProducts(
  sectionKey: HomepageSectionKey,
  products: CatalogProduct[],
  maxItems: number
): HomepageProductItem[] {
  const active = activeProducts(products);

  switch (sectionKey) {
    case "new_arrivals":
      return active
        .filter((product) => product.newArrival && product.price > 0)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, maxItems)
        .map((product, index) => toProductItem(product, undefined, index + 1));

    case "trending": {
      const trending = active
        .filter((product) => product.trending && product.price > 0)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, maxItems)
        .map((product) => toProductItem(product));

      if (trending.length > 0) return trending;

      return [...active]
        .filter((product) => product.price > 0)
        .sort(
          (a, b) =>
            b.reviewCount - a.reviewCount ||
            b.rating - a.rating ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, maxItems)
        .map((product) => toProductItem(product));
    }

    case "staff_picks": {
      const staffPicks = active
        .filter((product) => product.featured && product.price > 0)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, maxItems)
        .map((product) => toProductItem(product));

      if (staffPicks.length > 0) return staffPicks;

      return [...active]
        .filter((product) => product.price > 0)
        .sort(
          (a, b) =>
            b.reviewCount - a.reviewCount ||
            b.rating - a.rating ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, maxItems)
        .map((product) => toProductItem(product));
    }

    case "best_sellers":
      return [...active]
        .filter((product) => product.price > 0)
        .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
        .slice(0, maxItems)
        .map((product) => toProductItem(product));

    case "deals_of_the_day": {
      const discounted = active.filter(
        (product) =>
          product.price > 0 &&
          (product.discountPercentage > 0 ||
            (product.detail?.salePrice != null &&
              product.detail.salePrice < product.price))
      );
      const source =
        discounted.length > 0
          ? discounted.sort(
              (a, b) => b.discountPercentage - a.discountPercentage
            )
          : [...active]
              .filter((product) => product.price > 0)
              .sort(
                (a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating
              );
      return source.slice(0, maxItems).map((product) => {
        const salePrice = product.detail?.salePrice ?? null;
        const computedPct =
          product.discountPercentage > 0
            ? product.discountPercentage
            : salePrice != null && salePrice > 0 && product.price > salePrice
              ? Math.round(((product.price - salePrice) / product.price) * 100)
              : 0;

        return toProductItem(product, {
          badgeLabel: computedPct > 0 ? `${computedPct}% Off` : undefined,
          offerText: computedPct > 0 ? `Save ${computedPct}%` : undefined,
        });
      });
    }

    default:
      return [];
  }
}

async function resolveCategories(
  section: HomepageSection,
  items: HomepageSectionItem[]
): Promise<HomepageCategoryItem[]> {
  const categories = await listCategories();

  if (section.sourceMode === "manual") {
    const categoryMap = new Map(categories.map((category) => [category.slug, category]));
    const resolved: HomepageCategoryItem[] = [];

    for (const item of items) {
      if (!item.categorySlug) continue;
      const category = categoryMap.get(item.categorySlug);
      if (!category) continue;

      resolved.push({
        id: category.id,
        slug: category.slug,
        title: item.customTitle || category.name,
        href: item.customHref || categoryPath(category.slug),
        imageSrc: item.customImage || category.imageUrl || getCategoryGridImage(category.slug),
        badge: item.badgeLabel,
      });
    }

    return resolved;
  }

  return categories
    .filter((category) => category.isFeatured)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, section.maxItems)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      title: category.name,
      href: categoryPath(category.slug),
      imageSrc: category.imageUrl || getCategoryGridImage(category.slug),
    }));
}

async function resolveBrands(
  section: HomepageSection,
  items: HomepageSectionItem[]
): Promise<HomepageBrandItem[]> {
  const brands = await fetchBrands();
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));
  const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));

  // Shop Top Brands always follows TOP_BRAND_STRIP_SLUGS (ignores CMS manual picks).
  if (section.sectionKey === "brand_strip") {
    return buildTopBrandStripItems(brands);
  }

  if (section.sourceMode === "manual") {
    const resolved: HomepageBrandItem[] = [];

    for (const item of items) {
      const brand =
        (item.brandId ? brandById.get(item.brandId) : undefined) ??
        (item.brandId ? brandBySlug.get(item.brandId) : undefined);
      if (!brand) continue;

      resolved.push({
        id: brand.id,
        name: item.customTitle || brand.name,
        slug: brand.slug,
        href: item.customHref || `/search/results?brand=${encodeURIComponent(brand.slug)}`,
        logoUrl: item.customImage || getBrandLogoUrl(brand.slug),
      });
    }

    return resolved;
  }

  return brands.slice(0, section.maxItems).map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    href: `/search/results?brand=${encodeURIComponent(brand.slug)}`,
    logoUrl: getBrandLogoUrl(brand.slug),
  }));
}

function sectionDomId(sectionKey: HomepageSectionKey): string {
  const map: Record<HomepageSectionKey, string> = {
    new_arrivals: "top-new-products",
    best_sellers: "best-sellers",
    trending: "trending-products",
    staff_picks: "suggested-products",
    featured_categories: "popular-categories",
    deals_of_the_day: "sales-events",
    big_names_deals: "big-names-deals",
    brand_strip: "brand-strip",
  };
  return map[sectionKey];
}

async function resolveSection(
  section: HomepageSection,
  products: CatalogProduct[],
  at: Date,
  allSectionItems: HomepageSectionItem[]
): Promise<ResolvedHomepageSection | null> {
  if (section.sectionKey === "big_names_deals") {
    return null;
  }

  const items = allSectionItems
    .filter(
      (item) =>
        item.sectionKey === section.sectionKey &&
        item.isActive &&
        isHomepageItemScheduledActive(item, at)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const base: ResolvedHomepageSection = {
    key: section.sectionKey,
    sectionId: sectionDomId(section.sectionKey),
    title: section.title,
    subtitle: section.subtitle,
    accentLabel: section.accentLabel,
    ctaText: section.ctaText,
    ctaLink: section.ctaLink,
    layout: section.layout,
  };

  if (
    section.sectionKey === "featured_categories" ||
    section.layout === "category_grid"
  ) {
    let categories = await resolveCategories(section, items);
    if (
      categories.length === 0 &&
      section.sectionKey === "featured_categories"
    ) {
      categories = getHomepagePopularCategoryItems(
        section.maxItems || HOMEPAGE_POPULAR_CATEGORY_COUNT
      );
    }
    if (categories.length === 0) return null;
    return {
      ...base,
      ...(section.sectionKey === "featured_categories"
        ? {
            title: "Popular Categories",
            ctaText: "Browse All Categories",
            ctaLink: section.ctaLink || "/categories",
          }
        : null),
      categories,
    };
  }

  if (section.sectionKey === "brand_strip" || section.layout === "brand_strip") {
    const brands = await resolveBrands(section, items);
    if (brands.length === 0) return null;
    return { ...base, brands };
  }

  const resolvedProducts =
    section.sourceMode === "manual"
      ? resolveManualProducts(items, products)
      : resolveAutoProducts(section.sectionKey, products, section.maxItems);

  if (resolvedProducts.length === 0) return null;
  return { ...base, products: resolvedProducts };
}

function buildFeaturedCategoriesFallbackSection(at: Date): HomepageSection {
  const defaults = DEFAULT_HOMEPAGE_SECTIONS.find(
    (section) => section.sectionKey === "featured_categories"
  );

  return {
    id: "featured_categories",
    sectionKey: "featured_categories",
    title: defaults?.title ?? "Popular Categories",
    subtitle: defaults?.subtitle,
    accentLabel: defaults?.accentLabel,
    ctaText: defaults?.ctaText,
    ctaLink: defaults?.ctaLink,
    isActive: true,
    sortOrder: defaults?.sortOrder ?? 4,
    sourceMode: defaults?.sourceMode ?? "auto",
    maxItems: defaults?.maxItems ?? 12,
    layout: defaults?.layout ?? "category_grid",
    createdAt: at.toISOString(),
    updatedAt: at.toISOString(),
  };
}

export async function getBigNamesDealsPublicData(
  at = new Date()
): Promise<PublicBigNamesDealsData> {
  const defaults = DEFAULT_HOMEPAGE_SECTIONS.find(
    (section) => section.sectionKey === "big_names_deals"
  );

  try {
    const [section, products, allItems] = await Promise.all([
      getSectionByKey("big_names_deals"),
      getCachedActiveProducts(),
      listAllSectionItems(),
    ]);

    const config = section ?? {
      id: "big_names_deals",
      sectionKey: "big_names_deals" as const,
      title: defaults?.title ?? "Big names. Serious savings.",
      subtitle: defaults?.subtitle,
      accentLabel: defaults?.accentLabel ?? "Shop top brands",
      ctaText: defaults?.ctaText ?? "Shop All Deals",
      ctaLink: defaults?.ctaLink ?? BIG_NAMES_DEALS_CTA,
      isActive: defaults?.isActive ?? true,
      sortOrder: defaults?.sortOrder ?? 6,
      sourceMode: "manual" as const,
      maxItems: BIG_NAMES_DEALS_MAX_ITEMS,
      layout: "big_names_deals" as const,
      createdAt: at.toISOString(),
      updatedAt: at.toISOString(),
    };

    const productMap = new Map(products.map((product) => [product.id, product]));
    const items = allItems
      .filter(
        (item) =>
          item.sectionKey === "big_names_deals" &&
          item.isActive &&
          item.productId &&
          isHomepageItemScheduledActive(item, at)
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, BIG_NAMES_DEALS_MAX_ITEMS);

    const curated = items
      .map((item) => {
        const product = productMap.get(item.productId!);
        if (!product || !isBigNamesDealsGuitarProduct(product)) return null;
        return mapCatalogProductToBigNamesDeal(product, {
          href: item.customHref || undefined,
          image: item.customImage || undefined,
          title: item.customTitle || undefined,
        });
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      isActive: config.isActive,
      eyebrow: config.accentLabel ?? "Shop top brands",
      headline: config.title,
      subtitle:
        config.subtitle ??
        "Find all the top brands you already love, at prices that simply can't be beat",
      ctaText: config.ctaText ?? "Shop All Deals",
      ctaLink: config.ctaLink ?? BIG_NAMES_DEALS_CTA,
      items:
        curated.length > 0
          ? curated
          : resolveBigNamesDealFallbacks(products),
    };
  } catch {
    return {
      isActive: true,
      eyebrow: defaults?.accentLabel ?? "Shop top brands",
      headline: defaults?.title ?? "Big names. Serious savings.",
      subtitle:
        defaults?.subtitle ??
        "Find all the top brands you already love, at prices that simply can't be beat",
      ctaText: defaults?.ctaText ?? "Shop All Deals",
      ctaLink: defaults?.ctaLink ?? BIG_NAMES_DEALS_CTA,
      // Offline / DB-down: still deep-link each guitar to its product PDP.
      items: resolveBigNamesDealFallbacks([]),
    };
  }
}

export async function getPublicHomepageData(
  at = new Date()
): Promise<PublicHomepageData> {
  const staticFallback = (): Promise<PublicHomepageData> =>
    getHomepageStaticFallbacks(at);

  try {
    const [sections, products, allSectionItems] = await Promise.all([
      listActiveSections(),
      getCachedActiveProducts(),
      listAllSectionItems(),
    ]);

    const hasFeaturedCategories = sections.some(
      (section) => section.sectionKey === "featured_categories"
    );

    const orderedSections = hasFeaturedCategories
      ? sections
      : [...sections, buildFeaturedCategoriesFallbackSection(at)].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
        );

    const resolved = (
      await Promise.all(
        orderedSections.map((section) =>
          resolveSection(section, products, at, allSectionItems)
        )
      )
    ).filter((section): section is ResolvedHomepageSection => section !== null);

    if (resolved.length === 0) {
      return staticFallback();
    }

    return {
      sections: resolved,
      fetchedAt: at.toISOString(),
    };
  } catch {
    return staticFallback();
  }
}

export {
  createSectionItem,
  deleteSectionItem,
  getSectionByKey,
  getSectionItemById,
  listActiveSectionItems,
  listActiveSections,
  listAllSectionItems,
  listAllSections,
  listSectionItems,
  reorderSectionItems,
  updateSection,
  updateSectionItem,
  invalidateHomepageCache,
} from "@/lib/server/homepageRepository";
