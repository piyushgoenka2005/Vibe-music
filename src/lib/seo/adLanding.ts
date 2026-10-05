import { BRAND } from "@/lib/brand";
import { formatSubcategoryLabel } from "@/lib/product/productBreadcrumb";
import { brandPath, categoryPath, ROUTES } from "@/lib/routes";
import type { Metadata } from "next";

export interface SearchLandingParams {
  q?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
}

function firstCsv(value?: string): string {
  return value?.split(",")[0]?.trim() ?? "";
}

/**
 * Canonical storefront paths for filter-only search URLs used in ads and legacy links.
 * Returns null when the search results page should render as-is.
 */
export function resolveSearchResultsRedirect(params: SearchLandingParams): string | null {
  const query = params.q?.trim() ?? "";
  const category = firstCsv(params.category);
  const subcategory = firstCsv(params.subcategory);
  const brand = firstCsv(params.brand);

  if (query) return null;

  if (brand && !category && !subcategory) {
    return brandPath(brand);
  }

  if (category && !brand && !subcategory) {
    return categoryPath(category);
  }

  if (brand && category) {
    const qs = new URLSearchParams();
    qs.set("brand", brand);
    if (subcategory) qs.set("subcat", subcategory);
    const queryString = qs.toString();
    return queryString ? `${categoryPath(category)}?${queryString}` : categoryPath(category);
  }

  return null;
}

export function resolveSearchPageRedirect(params: { brand?: string }): string | null {
  const brand = firstCsv(params.brand);
  if (!brand) return null;
  return brandPath(brand);
}

/** Edge-safe redirect for legacy ad URLs (`?brand=` on /brands, /search, /search/results). */
export function resolveAdLandingRedirect(
  pathname: string,
  searchParams: URLSearchParams,
): string | null {
  const params: SearchLandingParams = {
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    subcategory: searchParams.get("subcategory") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
  };

  if (pathname === "/brands" && params.brand) {
    const brand = firstCsv(params.brand);
    return brand ? brandPath(brand) : null;
  }

  if (pathname === "/search") {
    return resolveSearchPageRedirect(params);
  }

  if (pathname === "/search/results") {
    return resolveSearchResultsRedirect(params);
  }

  return null;
}

export function buildSearchQueryMetadata(
  query: string,
  options?: { productCount?: number; imageUrl?: string },
): Metadata {
  const title = `${query} | ${BRAND.name}`;
  const description =
    options?.productCount && options.productCount > 0
      ? `Shop ${options.productCount} results for “${query}” at ${BRAND.name}. Authorized gear, warranties, and free delivery across India.`
      : `Search results for “${query}” at ${BRAND.name}.`;
  const canonicalUrl = `${BRAND.siteUrl}${ROUTES.searchResults}?q=${encodeURIComponent(query)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: BRAND.name,
      locale: "en_IN",
      type: "website",
      images: options?.imageUrl
        ? [{ url: options.imageUrl, width: 1200, height: 630, alt: query }]
        : undefined,
    },
    twitter: {
      card: options?.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: options?.imageUrl ? [options.imageUrl] : undefined,
    },
  };
}

export function buildCategoryFilteredMetadata(options: {
  categoryName: string;
  categorySlug: string;
  brandName?: string;
  brandSlug?: string;
  subcategoryRaw?: string;
  productCount?: number;
  imageUrl?: string;
  searchParams?: Record<string, string>;
}): Metadata {
  const subcategoryLabel = options.subcategoryRaw
    ? formatSubcategoryLabel(options.subcategoryRaw)
    : "";
  const brandLabel = options.brandName?.trim() ?? "";

  let title = `${options.categoryName} | ${BRAND.name}`;
  if (brandLabel && subcategoryLabel) {
    title = `${brandLabel} ${subcategoryLabel} | ${options.categoryName} | ${BRAND.name}`;
  } else if (brandLabel) {
    title = `${brandLabel} | ${options.categoryName} | ${BRAND.name}`;
  } else if (subcategoryLabel) {
    title = `${subcategoryLabel} | ${options.categoryName} | ${BRAND.name}`;
  }

  const description =
    options.productCount && options.productCount > 0
      ? `Browse ${options.productCount} ${[brandLabel, subcategoryLabel, options.categoryName].filter(Boolean).join(" · ")} products at ${BRAND.name}.`
      : `Explore ${options.categoryName} at ${BRAND.name}. Authentic instruments, pro gear, and free delivery across India.`;

  const params = new URLSearchParams(options.searchParams ?? {});
  const queryString = params.toString();
  const canonicalUrl = `${BRAND.siteUrl}${categoryPath(options.categorySlug)}${queryString ? `?${queryString}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: BRAND.name,
      locale: "en_IN",
      type: "website",
      images: options.imageUrl
        ? [{ url: options.imageUrl, width: 1200, height: 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: options.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: options.imageUrl ? [options.imageUrl] : undefined,
    },
  };
}

export function buildDealsMetadata(options?: {
  productCount?: number;
  imageUrl?: string;
}): Metadata {
  const title = `Deals | ${BRAND.name}`;
  const description =
    options?.productCount && options.productCount > 0
      ? `${options.productCount} limited-time deals on pro audio, instruments, and studio gear at ${BRAND.name}.`
      : "Limited-time deals on pro audio, instruments, and studio gear at Vibe Music.";
  const canonicalUrl = `${BRAND.siteUrl}${ROUTES.deals}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: BRAND.name,
      locale: "en_IN",
      type: "website",
      images: options?.imageUrl
        ? [{ url: options.imageUrl, width: 1200, height: 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: options?.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: options?.imageUrl ? [options.imageUrl] : undefined,
    },
  };
}
