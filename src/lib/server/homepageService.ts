import "server-only";

import {
  getCachedBrands,
  getCachedCategories,
  getCachedHomepageProducts,
} from "@/lib/server/catalogSnapshotCache";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { buildTopBrandStripItems } from "@/data/topBrandStrip";
import { getCategoryGridImage, hasCuratedCategoryImage } from "@/lib/categoryImages";
import { categoryPath, productPath, ROUTES } from "@/lib/routes";
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
import { BIG_NAMES_DEALS_CTA } from "@/data/bigNamesDeals";
import {
  BIG_NAMES_DEALS_MAX_ITEMS,
  isBigNamesDealsGuitarProduct,
  mapCatalogProductToBigNamesDeal,
  resolveBigNamesDealFallbacks,
} from "@/lib/homepage/bigNamesDeals";
import type { CatalogProduct } from "@/types/catalog";
import { unpackCategoryOfferText } from "@/lib/homepage/categoryOfferText";
import { BROWSE_CATEGORY_CARDS, BROWSE_CATEGORY_CARDS_CTA } from "@/data/browseCategoryCards";
import { CATEGORY_BENTO_ITEMS } from "@/data/categoryBento";
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

export interface PublicCategorySectionData {
  isActive: boolean;
  title: string;
  subtitle?: string;
  accentLabel?: string;
  ctaText: string;
  ctaLink: string;
  items: HomepageCategoryItem[];
}

export function invalidatePublicHomepageCache(): void {
  void import("@/lib/server/homepageSnapshotCache").then(({ revalidateHomepageSnapshot }) =>
    revalidateHomepageSnapshot(),
  );
}

/** Awaitable invalidation for admin writes (read-your-own-writes on storefront). */
export async function invalidatePublicHomepageCacheAsync(): Promise<void> {
  const { revalidateHomepageSnapshot } = await import("@/lib/server/homepageSnapshotCache");
  await revalidateHomepageSnapshot();
}

function activeProducts(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((product) => product.status === "active");
}

function toProductItem(
  product: CatalogProduct,
  overrides?: Partial<HomepageSectionItem>,
  rank?: number,
): HomepageProductItem {
  const hasDiscount = product.originalPrice > product.price && product.price > 0;
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
  products: CatalogProduct[],
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
  maxItems: number,
): HomepageProductItem[] {
  const active = activeProducts(products);

  switch (sectionKey) {
    case "new_arrivals":
      return active
        .filter((product) => product.newArrival && product.price > 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems)
        .map((product, index) => toProductItem(product, undefined, index + 1));

    case "trending": {
      const trending = active
        .filter((product) => product.trending && product.price > 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems)
        .map((product) => toProductItem(product));

      if (trending.length > 0) return trending;

      return [...active]
        .filter((product) => product.price > 0)
        .sort(
          (a, b) =>
            b.reviewCount - a.reviewCount ||
            b.rating - a.rating ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, maxItems)
        .map((product) => toProductItem(product));
    }

    case "staff_picks": {
      const staffPicks = active
        .filter((product) => product.featured && product.price > 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems)
        .map((product) => toProductItem(product));

      if (staffPicks.length > 0) return staffPicks;

      return [...active]
        .filter((product) => product.price > 0)
        .sort(
          (a, b) =>
            b.reviewCount - a.reviewCount ||
            b.rating - a.rating ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
            (product.detail?.salePrice != null && product.detail.salePrice < product.price)),
      );
      const source =
        discounted.length > 0
          ? discounted.sort((a, b) => b.discountPercentage - a.discountPercentage)
          : [...active]
              .filter((product) => product.price > 0)
              .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
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
  items: HomepageSectionItem[],
): Promise<HomepageCategoryItem[]> {
  const categories = await getCachedCategories();
  const allowFreeform =
    section.layout === "browse_category_cards" ||
    section.layout === "category_bento" ||
    section.sectionKey === "browse_by_categories" ||
    section.sectionKey === "category_bento";

  if (section.sourceMode === "manual") {
    const categoryMap = new Map(categories.map((category) => [category.slug, category]));
    const resolved: HomepageCategoryItem[] = [];

    for (const item of items) {
      const category = item.categorySlug ? categoryMap.get(item.categorySlug) : undefined;
      const { desc, brands } = unpackCategoryOfferText(item.offerText);

      if (!category && !allowFreeform) continue;
      if (!category && !(item.customTitle || item.customHref || item.customImage)) {
        continue;
      }

      const slug =
        item.categorySlug || category?.slug || item.id.replace(/^(browse|bento|popular)-cat-/, "");

      resolved.push({
        id: item.id,
        slug,
        title: item.customTitle || category?.name || slug,
        href: item.customHref || (category ? categoryPath(category.slug) : categoryPath(slug)),
        imageSrc:
          item.customImage ||
          (category && hasCuratedCategoryImage(category.slug)
            ? getCategoryGridImage(category.slug)
            : category?.imageUrl || getCategoryGridImage(slug)),
        badge: item.badgeLabel || undefined,
        desc,
        brands,
      });
    }

    return resolved.slice(0, section.maxItems);
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
      imageSrc: hasCuratedCategoryImage(category.slug)
        ? getCategoryGridImage(category.slug)
        : category.imageUrl || getCategoryGridImage(category.slug),
    }));
}

async function resolveBrands(
  section: HomepageSection,
  items: HomepageSectionItem[],
): Promise<HomepageBrandItem[]> {
  const brands = await getCachedBrands();
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));
  const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));

  const resolveManual = (): HomepageBrandItem[] => {
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
  };

  if (section.sectionKey === "brand_strip") {
    if (section.sourceMode === "manual") {
      const curated = resolveManual();
      if (curated.length > 0) return curated.slice(0, section.maxItems);
    }
    // Auto mode, or manual with no curated rows yet — keep storefront filled.
    return buildTopBrandStripItems(brands).slice(0, section.maxItems);
  }

  if (section.sourceMode === "manual") {
    return resolveManual();
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
    browse_by_categories: "browse-by-categories",
    category_bento: "category-bento",
    deals_of_the_day: "sales-events",
    big_names_deals: "big-names-deals",
    brand_strip: "brand-strip",
    featured_stories: "featured-gear-stories",
    social_rail: "social-rail",
  };
  return map[sectionKey];
}

async function resolveSection(
  section: HomepageSection,
  products: CatalogProduct[],
  at: Date,
  allSectionItems: HomepageSectionItem[],
): Promise<ResolvedHomepageSection | null> {
  if (
    section.sectionKey === "big_names_deals" ||
    section.sectionKey === "featured_stories" ||
    section.sectionKey === "browse_by_categories" ||
    section.sectionKey === "category_bento" ||
    section.sectionKey === "social_rail"
  ) {
    return null;
  }

  const items = allSectionItems
    .filter(
      (item) =>
        item.sectionKey === section.sectionKey &&
        item.isActive &&
        isHomepageItemScheduledActive(item, at),
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

  if (section.sectionKey === "featured_categories" || section.layout === "category_grid") {
    let categories = await resolveCategories(section, items);
    if (categories.length === 0 && section.sectionKey === "featured_categories") {
      categories = getHomepagePopularCategoryItems(
        section.maxItems || HOMEPAGE_POPULAR_CATEGORY_COUNT,
      );
    }
    if (categories.length === 0) return null;
    return {
      ...base,
      title: section.title || "Popular Categories",
      ctaText: section.ctaText || "Browse All Categories",
      ctaLink: section.ctaLink || "/categories",
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
    (section) => section.sectionKey === "featured_categories",
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
  at = new Date(),
): Promise<PublicBigNamesDealsData> {
  const defaults = DEFAULT_HOMEPAGE_SECTIONS.find(
    (section) => section.sectionKey === "big_names_deals",
  );

  try {
    const [section, products, allItems] = await Promise.all([
      getSectionByKey("big_names_deals"),
      getCachedHomepageProducts(),
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
          isHomepageItemScheduledActive(item, at),
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
      items: curated.length > 0 ? curated : resolveBigNamesDealFallbacks(products),
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

export async function getBrowseByCategoriesPublicData(
  at = new Date(),
): Promise<PublicCategorySectionData> {
  const defaults = DEFAULT_HOMEPAGE_SECTIONS.find(
    (section) => section.sectionKey === "browse_by_categories",
  );

  const fallbackItems: HomepageCategoryItem[] = BROWSE_CATEGORY_CARDS.map((card) => ({
    id: card.id,
    slug: card.id,
    title: card.title,
    href: card.href,
    imageSrc: card.image,
  }));

  try {
    const [section, allItems] = await Promise.all([
      getSectionByKey("browse_by_categories"),
      listAllSectionItems(),
    ]);

    const config = section ?? {
      id: "browse_by_categories",
      sectionKey: "browse_by_categories" as const,
      title: defaults?.title ?? "Browse by Categories",
      subtitle: defaults?.subtitle,
      accentLabel: defaults?.accentLabel,
      ctaText: defaults?.ctaText ?? "View All Gear",
      ctaLink: defaults?.ctaLink ?? BROWSE_CATEGORY_CARDS_CTA,
      isActive: defaults?.isActive ?? true,
      sortOrder: defaults?.sortOrder ?? 5,
      sourceMode: "manual" as const,
      maxItems: defaults?.maxItems ?? 12,
      layout: "browse_category_cards" as const,
      createdAt: at.toISOString(),
      updatedAt: at.toISOString(),
    };

    if (!config.isActive) {
      return {
        isActive: false,
        title: config.title,
        ctaText: config.ctaText ?? "View All Gear",
        ctaLink: config.ctaLink ?? BROWSE_CATEGORY_CARDS_CTA,
        items: [],
      };
    }

    const items = allItems
      .filter(
        (item) =>
          item.sectionKey === "browse_by_categories" &&
          item.isActive &&
          isHomepageItemScheduledActive(item, at),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const resolved = await resolveCategories(config, items);

    return {
      isActive: true,
      title: config.title || "Browse by Categories",
      subtitle: config.subtitle,
      accentLabel: config.accentLabel,
      ctaText: config.ctaText || "View All Gear",
      ctaLink: config.ctaLink || BROWSE_CATEGORY_CARDS_CTA,
      items: resolved.length > 0 ? resolved : fallbackItems,
    };
  } catch {
    return {
      isActive: true,
      title: defaults?.title ?? "Browse by Categories",
      ctaText: defaults?.ctaText ?? "View All Gear",
      ctaLink: defaults?.ctaLink ?? BROWSE_CATEGORY_CARDS_CTA,
      items: fallbackItems,
    };
  }
}

export async function getCategoryBentoPublicData(
  at = new Date(),
): Promise<PublicCategorySectionData> {
  const defaults = DEFAULT_HOMEPAGE_SECTIONS.find(
    (section) => section.sectionKey === "category_bento",
  );

  const fallbackItems: HomepageCategoryItem[] = CATEGORY_BENTO_ITEMS.map((item) => ({
    id: item.slug,
    slug: item.slug,
    title: item.title,
    href: categoryPath(item.slug),
    imageSrc: item.image,
    badge: item.badge,
    desc: item.desc,
    brands: item.brands,
  }));

  try {
    const [section, allItems] = await Promise.all([
      getSectionByKey("category_bento"),
      listAllSectionItems(),
    ]);

    const config = section ?? {
      id: "category_bento",
      sectionKey: "category_bento" as const,
      title: defaults?.title ?? "Shop by Category",
      subtitle: defaults?.subtitle,
      accentLabel: defaults?.accentLabel ?? "Explore Category",
      ctaText: defaults?.ctaText ?? "Browse all categories",
      ctaLink: defaults?.ctaLink ?? ROUTES.categories,
      isActive: defaults?.isActive ?? true,
      sortOrder: defaults?.sortOrder ?? 6,
      sourceMode: "manual" as const,
      maxItems: defaults?.maxItems ?? 12,
      layout: "category_bento" as const,
      createdAt: at.toISOString(),
      updatedAt: at.toISOString(),
    };

    if (!config.isActive) {
      return {
        isActive: false,
        title: config.title,
        accentLabel: config.accentLabel,
        ctaText: config.ctaText ?? "Browse all categories",
        ctaLink: config.ctaLink ?? ROUTES.categories,
        items: [],
      };
    }

    const items = allItems
      .filter(
        (item) =>
          item.sectionKey === "category_bento" &&
          item.isActive &&
          isHomepageItemScheduledActive(item, at),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const resolved = await resolveCategories(config, items);

    // Merge CMS fields with static presentation defaults (size/variant/images).
    const staticBySlug = new Map(CATEGORY_BENTO_ITEMS.map((item) => [item.slug, item]));
    const merged =
      resolved.length > 0
        ? resolved.map((item) => {
            const fallback = staticBySlug.get(item.slug);
            return {
              ...item,
              imageSrc: item.imageSrc || fallback?.image || item.imageSrc,
              desc: item.desc || fallback?.desc,
              brands: item.brands || fallback?.brands,
              badge: item.badge || fallback?.badge,
            };
          })
        : fallbackItems;

    return {
      isActive: true,
      title: config.title || "Shop by Category",
      subtitle: config.subtitle,
      accentLabel: config.accentLabel || "Explore Category",
      ctaText: config.ctaText || "Browse all categories",
      ctaLink: config.ctaLink || ROUTES.categories,
      items: merged,
    };
  } catch {
    return {
      isActive: true,
      title: defaults?.title ?? "Shop by Category",
      accentLabel: defaults?.accentLabel ?? "Explore Category",
      ctaText: defaults?.ctaText ?? "Browse all categories",
      ctaLink: defaults?.ctaLink ?? ROUTES.categories,
      items: fallbackItems,
    };
  }
}

export async function getPublicHomepageData(at = new Date()): Promise<PublicHomepageData> {
  const staticFallback = (): Promise<PublicHomepageData> => getHomepageStaticFallbacks(at);

  try {
    const [sections, products, allSectionItems] = await Promise.all([
      listActiveSections(),
      getCachedHomepageProducts(),
      listAllSectionItems(),
    ]);

    // Warm shared taxonomy caches once before parallel section resolve (avoids stampede).
    await Promise.all([getCachedCategories(), getCachedBrands()]);

    const hasFeaturedCategories = sections.some(
      (section) => section.sectionKey === "featured_categories",
    );

    const orderedSections = hasFeaturedCategories
      ? sections
      : [...sections, buildFeaturedCategoriesFallbackSection(at)].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
        );

    const resolved = (
      await Promise.all(
        orderedSections.map((section) => resolveSection(section, products, at, allSectionItems)),
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
