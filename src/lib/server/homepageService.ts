import "server-only";

import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  fetchAllProducts,
  fetchBrands,
} from "@/lib/server/firestoreCatalogRepository";
import { listCategories } from "@/lib/server/categoryRepository";
import { categoryPath, productPath } from "@/lib/routes";
import {
  listActiveSectionItems,
  listActiveSections,
} from "@/lib/server/homepageRepository";
import type { CatalogProduct } from "@/types/catalog";
import type {
  HomepageBrandItem,
  HomepageCategoryItem,
  HomepageProductItem,
  HomepageSection,
  HomepageSectionItem,
  HomepageSectionKey,
  PublicHomepageData,
  ResolvedHomepageSection,
} from "@/types/homepage";

const PUBLIC_CACHE_TTL_MS = 45_000;

let publicCache: PublicHomepageData | null = null;
let publicCacheAt = 0;

function isFresh(ts: number): boolean {
  return Date.now() - ts < PUBLIC_CACHE_TTL_MS;
}

export function invalidatePublicHomepageCache(): void {
  publicCache = null;
  publicCacheAt = 0;
}

function activeProducts(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((product) => product.status === "active");
}

function toProductItem(
  product: CatalogProduct,
  overrides?: Partial<HomepageSectionItem>,
  rank?: number
): HomepageProductItem {
  const salePrice = product.detail?.salePrice ?? null;
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    price: product.price,
    salePrice,
    image: product.image || product.images[0] || "",
    imageAlt: product.name,
    rating: product.rating,
    reviewCount: product.reviewCount,
    href: productPath(product.slug),
    badgeLabel: overrides?.badgeLabel,
    offerText: overrides?.offerText,
    rank,
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
      if (!product || product.status !== "active") return null;
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
        .filter((product) => product.newArrival)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, maxItems)
        .map((product, index) => toProductItem(product, undefined, index + 1));

    case "trending":
      return active
        .filter((product) => product.trending)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, maxItems)
        .map((product) => toProductItem(product));

    case "staff_picks":
      return active
        .filter((product) => product.featured)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, maxItems)
        .map((product) => toProductItem(product));

    case "best_sellers":
      return [...active]
        .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
        .slice(0, maxItems)
        .map((product) => toProductItem(product));

    case "deals_of_the_day":
      return active
        .filter(
          (product) =>
            product.discountPercentage > 0 ||
            (product.detail?.salePrice != null &&
              product.detail.salePrice < product.price)
        )
        .sort((a, b) => b.discountPercentage - a.discountPercentage)
        .slice(0, maxItems)
        .map((product) =>
          toProductItem(product, {
            badgeLabel: product.discountPercentage
              ? `${product.discountPercentage}% Off`
              : "Deal",
            offerText: product.discountPercentage
              ? `Save ${product.discountPercentage}%`
              : undefined,
          })
        );

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
        imageSrc: item.customImage || category.imageUrl || "",
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
      imageSrc: category.imageUrl || "",
    }));
}

async function resolveBrands(
  section: HomepageSection,
  items: HomepageSectionItem[]
): Promise<HomepageBrandItem[]> {
  const brands = await fetchBrands();
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));
  const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));

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
        href: item.customHref || `/search?brand=${encodeURIComponent(brand.slug)}`,
        logoUrl: item.customImage,
      });
    }

    return resolved;
  }

  return brands.slice(0, section.maxItems).map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    href: `/search?brand=${encodeURIComponent(brand.slug)}`,
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
    brand_strip: "brand-strip",
  };
  return map[sectionKey];
}

async function resolveSection(
  section: HomepageSection,
  products: CatalogProduct[],
  at: Date
): Promise<ResolvedHomepageSection | null> {
  const items = await listActiveSectionItems(section.sectionKey, at);
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
    const categories = await resolveCategories(section, items);
    if (categories.length === 0) return null;
    return { ...base, categories };
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

export async function getPublicHomepageData(
  at = new Date()
): Promise<PublicHomepageData> {
  if (!isFirebaseAdminConfigured()) {
    return { sections: [], fetchedAt: at.toISOString() };
  }

  if (publicCache && isFresh(publicCacheAt)) {
    return publicCache;
  }

  const [sections, products] = await Promise.all([
    listActiveSections(),
    fetchAllProducts(),
  ]);

  const resolved = (
    await Promise.all(sections.map((section) => resolveSection(section, products, at)))
  ).filter((section): section is ResolvedHomepageSection => section !== null);

  const payload: PublicHomepageData = {
    sections: resolved,
    fetchedAt: at.toISOString(),
  };

  publicCache = payload;
  publicCacheAt = Date.now();
  return payload;
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
