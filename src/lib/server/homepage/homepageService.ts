import "server-only";

import {
  getCachedBrands,
  getCachedCategories,
  getCachedHomepageProducts,
} from "@/lib/server/catalogSnapshotCache";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { buildTopBrandStripItems } from "@/data/topBrandStrip";
import { resolveProductCardImage } from "@/lib/product/resolveProductCardImage";
import { getCategoryGridImage, hasCuratedCategoryImage } from "@/lib/categoryImages";
import { brandPath, categoryPath, productPath, ROUTES } from "@/lib/routes";
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
import { BIG_NAMES_DEALS, BIG_NAMES_DEALS_CTA } from "@/data/bigNamesDeals";
import {
  BIG_NAMES_DEALS_MAX_ITEMS,
  isBigNamesDealsGuitarProduct,
  isRenderableBigNamesDealItem,
  mapCatalogProductToBigNamesDeal,
  resolveBigNamesDealFallbacks,
} from "@/lib/homepage/bigNamesDeals";
import type { CatalogProduct } from "@/types/catalog";
import { clampHomepageMaxItems } from "@/lib/homepage/homepageLimits";
import { unpackCategoryOfferText } from "@/lib/homepage/categoryOfferText";
import { BROWSE_CATEGORY_CARDS, BROWSE_CATEGORY_CARDS_CTA } from "@/data/browseCategoryCards";
import { CATEGORY_BENTO_ITEMS } from "@/data/categoryBento";
import { buildCategoryBentoCatalogMeta } from "@/lib/server/categoryBentoCatalog";
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
  StoreLocationItem,
  GearReelItem,
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
  const resolvedImage = resolveProductCardImage({
    slug: product.slug,
    category: product.category,
    image: overrides?.customImage || product.image,
    images: product.images,
  });
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    price: hasDiscount ? product.originalPrice : product.price,
    salePrice,
    image: resolvedImage.src,
    imageFallback: resolvedImage.fallbackSrc,
    imageAlt: overrides?.customTitle || product.name,
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
      if (!product || product.status !== "active") return null;
      // Manual pins stay visible even when price is TBD / Coming Soon (price <= 0).
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

  // For featured_categories: show ALL main categories (not just featured), with manual override support
  if (section.sectionKey === "featured_categories") {
    // First, get all manually configured items (for those featured)
    const configuredSlugs = new Set(items.map((item) => item.categorySlug).filter(Boolean));
    const configured: HomepageCategoryItem[] = [];

    for (const slug of configuredSlugs) {
      const cat = categories.find((c) => c.slug === slug);
      if (!cat) continue;
      const item = items.find((i) => i.categorySlug === slug);
      configured.push({
        id: cat.id,
        slug: cat.slug,
        title: item?.customTitle || cat.name,
        href: item?.customHref || categoryPath(cat.slug),
        imageSrc: item?.customImage || cat.imageUrl || getCategoryGridImage(cat.slug),
        badge: item?.badgeLabel,
      });
    }

    // Add unconfigured main categories (not in manual items list)
    const unconfigured: HomepageCategoryItem[] = categories
      .filter((cat) => !cat.parentId && !configuredSlugs.has(cat.slug))
      .map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        title: cat.name,
        href: categoryPath(cat.slug),
        imageSrc: cat.imageUrl || getCategoryGridImage(cat.slug),
        badge: undefined,
      }));

    return [...configured, ...unconfigured]
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, section.maxItems);
  }

  // Support both featured parent and child categories, preventing duplicates
  const featured = categories.filter((category) => category.isFeatured);
  const pool = featured.length > 0 ? featured : categories.filter((category) => !category.parentId);

  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();
  const uniquePool = pool.filter((category) => {
    const normSlug = category.slug.toLowerCase().replace(/s$/, "");
    const normName = category.name.toLowerCase().replace(/s$/, "");
    if (seenSlugs.has(normSlug) || seenNames.has(normName)) {
      return false;
    }
    seenSlugs.add(normSlug);
    seenNames.add(normName);
    return true;
  });

  return uniquePool
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
        href: item.customHref || brandPath(brand.slug),
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
    href: brandPath(brand.slug),
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
    gear_stories: "gear-stories",
    shop_the_highlights: "shop-the-highlights",
    gear_advisors: "gear-advisors",
    store_network: "store-network",
    find_your_product: "find-your-product",
    social_rail: "social-rail",
  };
  return map[sectionKey];
}

async function resolveStores(
  section: HomepageSection,
  items: HomepageSectionItem[],
): Promise<StoreLocationItem[]> {
  if (section.sourceMode === "manual") {
    return items
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item, index) => ({
        id: item.id,
        name: item.customTitle || `Store ${index + 1}`,
        city: item.categorySlug || "",
        address: item.offerText,
        customImage: item.customImage,
        customTitle: item.customTitle,
        badgeLabel: item.badgeLabel,
        contactLink: item.customHref,
        sortOrder: item.sortOrder,
      }))
      .slice(0, section.maxItems);
  }

  // Auto mode - return static stores
  return [
    {
      id: "store-delhi",
      name: "Delhi",
      city: "Delhi",
      address: "Visit us",
      badgeLabel: "VISIT US",
      sortOrder: 0,
    },
    {
      id: "store-kolkata",
      name: "Kolkata",
      city: "Kolkata",
      address: "Visit us",
      badgeLabel: "VISIT US",
      sortOrder: 1,
    },
    {
      id: "store-nagpur",
      name: "Nagpur",
      city: "Nagpur",
      address: "Partner Hub",
      badgeLabel: "PARTNER HUB",
      sortOrder: 2,
    },
    {
      id: "store-northeast",
      name: "North East",
      city: "North East",
      address: "Flagship",
      badgeLabel: "FLAGSHIP",
      sortOrder: 3,
    },
    {
      id: "store-mumbai",
      name: "Mumbai",
      city: "Mumbai",
      address: "Flagship",
      badgeLabel: "FLAGSHIP",
      sortOrder: 4,
    },
  ];
}

async function resolveFindYourProduct(
  section: HomepageSection,
  items: HomepageSectionItem[],
): Promise<HomepageCategoryItem[]> {
  if (section.sourceMode === "manual") {
    return items
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item, index) => {
        // Parse the categorySlug to get category information
        const categorySlug = item.categorySlug || "";
        let categoryName = item.customTitle || "";
        let categoryDescription = item.offerText || "";

        // If no custom title, generate from category slug
        if (!categoryName && categorySlug) {
          categoryName = categorySlug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }

        // If no description, create default
        if (!categoryDescription) {
          categoryDescription = "Shop top brands and exclusive collections";
        }

        return {
          id: item.id,
          slug: categorySlug || `category-${index + 1}`,
          title: categoryName || `Category ${index + 1}`,
          href: item.customHref || `/category/${categorySlug}`,
          imageSrc: item.customImage || "",
          badge: item.badgeLabel,
          desc: categoryDescription,
          productCount: "100+ products",
        };
      })
      .slice(0, section.maxItems);
  }

  // Auto mode - return popular categories
  const { loadCategories } = await import("@/lib/server/catalogRepository");

  try {
    // Try to load categories from database
    const categories = loadCategories();
    return categories.slice(0, section.maxItems || 6).map((category, index) => ({
      id: `category-${category.slug}`,
      slug: category.slug,
      title: category.name,
      href: `/category/${category.slug}`,
      imageSrc: category.imageUrl || "",
      badge: index === 0 ? "TRENDING" : index === 1 ? "NEW" : undefined,
      desc: category.description || "Shop curated selection",
      productCount: `${Math.floor(Math.random() * 50) + 50}+ products`,
    }));
  } catch {
    // Fallback to static categories
    return [
      {
        id: "category-guitars",
        slug: "guitars",
        title: "Guitars",
        href: "/category/guitars",
        imageSrc: "",
        badge: "TRENDING",
        desc: "Acoustic & electric guitars",
        productCount: "150+ products",
      },
      {
        id: "category-drums",
        slug: "drums",
        title: "Drums",
        href: "/category/drums",
        imageSrc: "",
        badge: "NEW",
        desc: "Full kits & percussion",
        productCount: "120+ products",
      },
      {
        id: "category-keyboards",
        slug: "keyboards",
        title: "Keyboards & Pianos",
        href: "/category/keyboards",
        imageSrc: "",
        desc: "Digital & acoustic",
        productCount: "90+ products",
      },
      {
        id: "category-live-sound",
        slug: "live-sound",
        title: "Live Sound",
        href: "/category/live-sound",
        imageSrc: "",
        desc: "PA systems & mixers",
        productCount: "80+ products",
      },
      {
        id: "category-recording",
        slug: "recording",
        title: "Recording Gear",
        href: "/category/recording",
        imageSrc: "",
        desc: "Studio equipment",
        productCount: "70+ products",
      },
      {
        id: "category-accessories",
        slug: "accessories",
        title: "Accessories",
        href: "/category/accessories",
        imageSrc: "",
        desc: "Cables, stands & more",
        productCount: "200+ products",
      },
    ].slice(0, section.maxItems || 6);
  }
}

async function resolveGearReels(
  section: HomepageSection,
  items: HomepageSectionItem[],
): Promise<GearReelItem[]> {
  if (section.sourceMode === "manual") {
    return items
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        title: item.customTitle || "Gear Reel",
        description: item.offerText,
        posterUrl: item.customImage,
        videoUrl: item.customHref || "",
        instagramHandle: item.categorySlug, // Using categorySlug for instagram handle
        instagramLink: item.productId || "", // Using productId for instagram link
        productId: item.brandId,
        badgeLabel: item.badgeLabel,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      }))
      .slice(0, section.maxItems);
  }

  // Auto mode - return default gear reels
  return [
    {
      id: "reel-1",
      title: "Hertz HZA-UK(24)",
      posterUrl: "/images/gear-reels/hertz-1.webp",
      videoUrl: "https://cdn.vibemusic.in/videos/style-story/reel-1.mp4",
      instagramHandle: "@hertzmusicindia",
      instagramLink: "https://www.instagram.com/p/DeHUpIBh84q/",
      sortOrder: 0,
      isActive: true,
    },
    {
      id: "reel-2",
      title: "Hertz HZA-3600",
      posterUrl: "/images/gear-reels/hertz-2.webp",
      videoUrl: "https://cdn.vibemusic.in/videos/style-story/reel-2.mp4",
      instagramHandle: "@hertzmusicindia",
      instagramLink: "https://www.instagram.com/p/DeHUpIBh84q/",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "reel-3",
      title: "Hertz HZA-3900",
      posterUrl: "/images/gear-reels/hertz-3.webp",
      videoUrl: "https://cdn.vibemusic.in/videos/style-story/reel-3.mp4",
      instagramHandle: "@hertzmusicindia",
      instagramLink: "https://www.instagram.com/p/DeHUpIBh84q/",
      sortOrder: 2,
      isActive: true,
    },
    {
      id: "reel-4",
      title: "Hertz HZA4040 EQ",
      posterUrl: "/images/gear-reels/hertz-4.webp",
      videoUrl: "https://cdn.vibemusic.in/videos/style-story/reel-4.mp4",
      instagramHandle: "@hertzmusicindia",
      instagramLink: "https://www.instagram.com/p/DeHUpIBh84q/",
      sortOrder: 3,
      isActive: true,
    },
    {
      id: "reel-5",
      title: 'AVUS Distack 10"',
      posterUrl: "/images/gear-reels/avus-1.webp",
      videoUrl: "https://cdn.vibemusic.in/videos/style-story/reel-5.mp4",
      instagramHandle: "@hertzmusicindia",
      instagramLink: "https://www.instagram.com/p/DeHUpIBh84q/",
      sortOrder: 4,
      isActive: true,
    },
    {
      id: "reel-6",
      title: "ADEON AD15DSP",
      posterUrl: "/images/gear-reels/adeon-1.webp",
      videoUrl: "https://cdn.vibemusic.in/videos/style-story/reel-6.mp4",
      instagramHandle: "@hertzmusicindia",
      instagramLink: "https://www.instagram.com/p/DeHUpIBh84q/",
      sortOrder: 5,
      isActive: true,
    },
  ].slice(0, section.maxItems);
}

async function resolveSection(
  section: HomepageSection,
  products: CatalogProduct[],
  at: Date,
  allSectionItems: HomepageSectionItem[],
): Promise<ResolvedHomepageSection | null> {
  const effectiveSection: HomepageSection = {
    ...section,
    maxItems: clampHomepageMaxItems(section.layout, section.maxItems),
  };

  if (
    effectiveSection.sectionKey === "big_names_deals" ||
    effectiveSection.sectionKey === "featured_stories" ||
    effectiveSection.sectionKey === "browse_by_categories" ||
    effectiveSection.sectionKey === "category_bento" ||
    effectiveSection.sectionKey === "social_rail"
  ) {
    return null;
  }

  const items = allSectionItems
    .filter(
      (item) =>
        item.sectionKey === effectiveSection.sectionKey &&
        item.isActive &&
        isHomepageItemScheduledActive(item, at),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const base: ResolvedHomepageSection = {
    key: effectiveSection.sectionKey,
    sectionId: sectionDomId(effectiveSection.sectionKey),
    title: effectiveSection.title,
    subtitle: effectiveSection.subtitle,
    accentLabel: effectiveSection.accentLabel,
    ctaText: effectiveSection.ctaText,
    ctaLink: effectiveSection.ctaLink,
    layout: effectiveSection.layout,
  };

  if (
    effectiveSection.sectionKey === "store_network" ||
    effectiveSection.layout === "store_network_grid"
  ) {
    const stores = await resolveStores(effectiveSection, items);
    if (stores.length === 0) return null;

    return {
      ...base,
      title: effectiveSection.title || "Discover our locations",
      subtitle: effectiveSection.subtitle,
      ctaText: effectiveSection.ctaText,
      ctaLink: effectiveSection.ctaLink,
      stores,
    };
  }

  if (
    effectiveSection.sectionKey === "gear_stories" ||
    effectiveSection.layout === "gear_stories_reels"
  ) {
    const reels = await resolveGearReels(effectiveSection, items);
    if (reels.length === 0) return null;

    return {
      ...base,
      title: effectiveSection.title || "Gear style stories",
      subtitle: effectiveSection.subtitle || "Discover instruments in action.",
      ctaText: effectiveSection.ctaText,
      ctaLink: effectiveSection.ctaLink,
      reels,
    };
  }

  if (
    effectiveSection.sectionKey === "find_your_product" ||
    effectiveSection.layout === "find_your_product"
  ) {
    const findYourProductItems = await resolveFindYourProduct(effectiveSection, items);
    if (findYourProductItems.length === 0) return null;

    return {
      ...base,
      title: effectiveSection.title || "Find Your Product",
      subtitle:
        effectiveSection.subtitle ||
        "Curated departments for every stage — from bedroom studio to main stage.",
      accentLabel: effectiveSection.accentLabel || "Shop by category",
      ctaText: effectiveSection.ctaText || "Browse all categories",
      ctaLink: effectiveSection.ctaLink || ROUTES.categories,
      categories: findYourProductItems,
    };
  }

  if (
    effectiveSection.sectionKey === "featured_categories" ||
    effectiveSection.layout === "category_grid"
  ) {
    let categories = await resolveCategories(effectiveSection, items);
    if (categories.length === 0 && effectiveSection.sectionKey === "featured_categories") {
      const { isPostgresConfigured } = await import("@/lib/db/prisma");
      if (!isPostgresConfigured()) {
        categories = getHomepagePopularCategoryItems(
          effectiveSection.maxItems || HOMEPAGE_POPULAR_CATEGORY_COUNT,
        );
      }
    }
    if (categories.length === 0) return null;
    return {
      ...base,
      title: effectiveSection.title || "Popular Categories",
      ctaText: effectiveSection.ctaText || "Browse All Categories",
      ctaLink: effectiveSection.ctaLink || ROUTES.categories,
      categories,
    };
  }

  if (effectiveSection.sectionKey === "brand_strip" || effectiveSection.layout === "brand_strip") {
    const brands = await resolveBrands(effectiveSection, items);
    if (brands.length === 0) return null;
    return { ...base, brands };
  }

  const resolvedProducts =
    effectiveSection.sourceMode === "manual"
      ? resolveManualProducts(items, products)
      : resolveAutoProducts(effectiveSection.sectionKey, products, effectiveSection.maxItems);

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
      .map((item, index) => {
        const product = productMap.get(item.productId!);
        if (!product || !isBigNamesDealsGuitarProduct(product)) return null;
        const dealKey = BIG_NAMES_DEALS.find((deal) => deal.productSlug === product.slug)?.key;
        return mapCatalogProductToBigNamesDeal(product, {
          href: item.customHref || undefined,
          title: item.customTitle || undefined,
          customImage: item.customImage || undefined,
          dealKey,
          slotIndex: index,
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
      items: (curated.length > 0 ? curated : resolveBigNamesDealFallbacks(products)).filter(
        isRenderableBigNamesDealItem,
      ),
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
      items: resolveBigNamesDealFallbacks([]).filter(isRenderableBigNamesDealItem),
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

function withLiveCategoryBentoMeta<
  T extends { slug: string; brands?: string; productCount?: string },
>(items: T[], catalogMeta: Map<string, { brands?: string; productCount?: string }>): T[] {
  return items.map((item) => {
    const live = catalogMeta.get(item.slug);
    return {
      ...item,
      brands: item.brands || live?.brands,
      productCount: item.productCount || live?.productCount,
    };
  });
}

export async function getCategoryBentoPublicData(
  at = new Date(),
): Promise<PublicCategorySectionData> {
  const defaults = DEFAULT_HOMEPAGE_SECTIONS.find(
    (section) => section.sectionKey === "category_bento",
  );
  const catalogMeta = await buildCategoryBentoCatalogMeta();

  const fallbackItems: HomepageCategoryItem[] = withLiveCategoryBentoMeta(
    CATEGORY_BENTO_ITEMS.map((item) => ({
      id: item.slug,
      slug: item.slug,
      title: item.title,
      href: categoryPath(item.slug),
      imageSrc: item.image,
      badge: item.badge,
      desc: item.desc,
    })),
    catalogMeta,
  );

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
    const merged = withLiveCategoryBentoMeta(
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
        : fallbackItems,
      catalogMeta,
    );

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

/**
 * Fetch shop_the_highlights section for storefront rendering.
 * Returns database-driven manual products or static fallbacks.
 */
export async function getShopTheHighlightsPublicData(at = new Date()): Promise<{
  isActive: boolean;
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaLink: string;
  products: HomepageProductItem[];
}> {
  const defaults = DEFAULT_HOMEPAGE_SECTIONS.find(
    (section) => section.sectionKey === "shop_the_highlights",
  );

  try {
    const [section, products, allItems] = await Promise.all([
      getSectionByKey("shop_the_highlights"),
      getCachedHomepageProducts(),
      listAllSectionItems(),
    ]);

    const config = section ?? {
      id: "shop_the_highlights",
      sectionKey: "shop_the_highlights" as const,
      title: defaults?.title ?? "Shop the Highlights",
      subtitle: defaults?.subtitle,
      accentLabel: defaults?.accentLabel,
      ctaText: defaults?.ctaText ?? "Shop All Products",
      ctaLink: defaults?.ctaLink ?? ROUTES.search,
      isActive: defaults?.isActive ?? true,
      sortOrder: defaults?.sortOrder ?? 3,
      sourceMode: "manual" as const,
      maxItems: 3,
      layout: "product_grid" as const,
      createdAt: at.toISOString(),
      updatedAt: at.toISOString(),
    };

    if (!config.isActive) {
      return {
        isActive: false,
        title: config.title,
        subtitle: config.subtitle,
        ctaText: config.ctaText ?? "Shop All Products",
        ctaLink: config.ctaLink ?? ROUTES.search,
        products: [],
      };
    }

    const items = allItems
      .filter(
        (item) =>
          item.sectionKey === "shop_the_highlights" &&
          item.isActive &&
          item.productId &&
          isHomepageItemScheduledActive(item, at),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 3); // Enforce hard limit of 3

    const resolved = resolveManualProducts(items, products);

    // Use static fallback if no items configured
    const fallbackProducts: HomepageProductItem[] = [];
    if (resolved.length === 0) {
      const { HOMEPAGE_TOP_PRODUCTS } = await import("@/data/homepageTopProducts");
      const staticMap = new Map(products.map((p) => [p.slug, p]));

      for (const staticItem of HOMEPAGE_TOP_PRODUCTS) {
        const catalogProduct = staticItem.productSlug
          ? staticMap.get(staticItem.productSlug)
          : null;
        if (!catalogProduct) continue;

        const item: HomepageSectionItem = {
          id: staticItem.id,
          sectionKey: "shop_the_highlights",
          productId: catalogProduct.id,
          categorySlug: undefined,
          customTitle: staticItem.title,
          customHref: staticItem.href,
          customImage: staticItem.image,
          badgeLabel: undefined,
          offerText: undefined,
          isActive: true,
          sortOrder: 0,
          startDate: undefined,
          endDate: undefined,
          createdAt: at.toISOString(),
          updatedAt: at.toISOString(),
        };

        fallbackProducts.push(toProductItem(catalogProduct, item, fallbackProducts.length + 1));
      }
    }

    const finalProducts = resolved.length > 0 ? resolved : fallbackProducts;

    if (finalProducts.length === 0) {
      return {
        isActive: false,
        title: config.title,
        subtitle: config.subtitle,
        ctaText: config.ctaText ?? "Shop All Products",
        ctaLink: config.ctaLink ?? ROUTES.search,
        products: [],
      };
    }

    return {
      isActive: true,
      title: config.title || "Shop the Highlights",
      subtitle: config.subtitle,
      ctaText: config.ctaText || "Shop All Products",
      ctaLink: config.ctaLink || ROUTES.search,
      products: finalProducts,
    };
  } catch {
    // Database down: use static fallback
    const { HOMEPAGE_TOP_PRODUCTS } = await import("@/data/homepageTopProducts");
    const products = await getCachedHomepageProducts();
    const staticMap = new Map(products.map((p) => [p.slug, p]));

    const fallbackProducts: HomepageProductItem[] = [];
    for (const staticItem of HOMEPAGE_TOP_PRODUCTS) {
      const catalogProduct = staticItem.productSlug ? staticMap.get(staticItem.productSlug) : null;
      if (!catalogProduct) continue;

      const item: HomepageSectionItem = {
        id: staticItem.id,
        sectionKey: "shop_the_highlights",
        productId: catalogProduct.id,
        categorySlug: undefined,
        customTitle: staticItem.title,
        customHref: staticItem.href,
        customImage: staticItem.image,
        badgeLabel: undefined,
        offerText: undefined,
        isActive: true,
        sortOrder: 0,
        startDate: undefined,
        endDate: undefined,
        createdAt: at.toISOString(),
        updatedAt: at.toISOString(),
      };

      fallbackProducts.push(toProductItem(catalogProduct, item, fallbackProducts.length + 1));
    }

    return {
      isActive: true,
      title: defaults?.title ?? "Shop the Highlights",
      subtitle: defaults?.subtitle,
      ctaText: defaults?.ctaText ?? "Shop All Products",
      ctaLink: defaults?.ctaLink ?? ROUTES.search,
      products: fallbackProducts.slice(0, 3),
    };
  }
}

/**
 * Fetch gear_advisors editorial section for storefront rendering.
 * Returns database-driven editorial content with customizable eyebrow, title, subtitle, CTA, and image.
 */
export async function getGearAdvisorsPublicData(at = new Date()): Promise<{
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { text: string; href: string };
  image: { src: string; alt: string };
} | null> {
  const defaults = DEFAULT_HOMEPAGE_SECTIONS.find(
    (section) => section.sectionKey === "gear_advisors",
  );

  try {
    const [section, allItems] = await Promise.all([
      getSectionByKey("gear_advisors"),
      listAllSectionItems(),
    ]);

    const config = section ?? {
      id: "gear_advisors",
      sectionKey: "gear_advisors" as const,
      title: defaults?.title ?? "Gear advisors, not a warehouse",
      subtitle: defaults?.subtitle ?? "Pro gear. Honest advice. Delivered across India.",
      accentLabel: defaults?.accentLabel ?? "Gear advisors, not a warehouse",
      ctaText: defaults?.ctaText ?? "Explore studio gear",
      ctaLink: defaults?.ctaLink ?? ROUTES.search,
      isActive: defaults?.isActive ?? true,
      sortOrder: defaults?.sortOrder ?? 12,
      sourceMode: "manual" as const,
      maxItems: 1,
      layout: "editorial_split" as const,
      createdAt: at.toISOString(),
      updatedAt: at.toISOString(),
    };

    if (!config.isActive) {
      return null;
    }

    const items = allItems
      .filter(
        (item) =>
          item.sectionKey === "gear_advisors" &&
          item.isActive &&
          isHomepageItemScheduledActive(item, at),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 1); // Max 1 item for editorial split

    // Use configured item or defaults
    const item = items[0];

    if (item) {
      return {
        isActive: true,
        eyebrow: item.customTitle || config.accentLabel || "Gear advisors, not a warehouse",
        title: config.title || "Pro gear. Honest advice. Delivered across India.",
        subtitle:
          config.subtitle ||
          "Whether you're building your first home studio or upgrading a worship rig, our team helps you choose gear that fits your budget and your goals.",
        cta: {
          text: item.offerText || config.ctaText || "Explore studio gear",
          href: item.customHref || config.ctaLink || ROUTES.search,
        },
        image: {
          src: item.customImage || "/images/editorial-guitar.jpg",
          alt:
            item.badgeLabel || "Professional electric guitar — expert gear advice for every player",
        },
      };
    }

    // Default fallback
    return {
      isActive: true,
      eyebrow: config.accentLabel || "Gear advisors, not a warehouse",
      title: config.title || "Pro gear. Honest advice. Delivered across India.",
      subtitle:
        config.subtitle ||
        "Whether you're building your first home studio or upgrading a worship rig, our team helps you choose gear that fits your budget and your goals.",
      cta: {
        text: config.ctaText || "Explore studio gear",
        href: config.ctaLink || ROUTES.search,
      },
      image: {
        src: "/images/editorial-guitar.jpg",
        alt: "Professional electric guitar — expert gear advice for every player",
      },
    };
  } catch {
    // Database down: use static fallback
    return {
      isActive: true,
      eyebrow: defaults?.accentLabel ?? "Gear advisors, not a warehouse",
      title: defaults?.title ?? "Pro gear. Honest advice. Delivered across India.",
      subtitle:
        defaults?.subtitle ??
        "Whether you're building your first home studio or upgrading a worship rig, our team helps you choose gear that fits your budget and your goals.",
      cta: {
        text: defaults?.ctaText ?? "Explore studio gear",
        href: defaults?.ctaLink ?? ROUTES.search,
      },
      image: {
        src: "/images/editorial-guitar.jpg",
        alt: "Professional electric guitar — expert gear advice for every player",
      },
    };
  }
}
