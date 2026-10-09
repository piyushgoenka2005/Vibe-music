import { getProductImage } from "@/data/productImages";
import { isCdnUrl } from "@/lib/cdnConfig";
import {
  isDisallowedStorefrontImageUrl,
  sanitizeStorefrontImageUrl,
} from "@/lib/storefront/coerceSecureAssetUrl";

export interface ProductCardImageInput {
  slug: string;
  category?: string;
  image?: string | null;
  images?: Array<string | { src?: string } | null> | null;
}

/** Flat white-background packshots — less ideal for cards but still this SKU's art. */
const FLAT_PACKSHOT_FILES = new Set([
  "8dbab992-6ab1-4b7b-ae61-4ad72ec93351.png",
  "c2c0dad6-9522-4d44-b686-4ab6076b2d7d.png",
  "413d7e18-9f0d-44cf-ba41-179e18fd5175.png",
  /** HZA-6000 hero — white packshot vanishes on ivory homepage showcase. */
  "0c482bf6-3921-4e88-b9b4-b13b3031012d.png",
]);

/** Wide lifestyle uploads that crop to a tiny product in square cards. */
const WIDE_CARD_UNFRIENDLY_FILES = new Set(["e853f8d2-cfec-4a70-a7c8-ec3751205191.png"]);

/** Horizontal or tight detail crops that break the standing-guitar Big Names row. */
const BIG_NAMES_SHOWCASE_UNFRIENDLY_FILES = new Set([
  /** HZA-6000 — guitar lying on its side */
  "7eb0b094-9d3b-48c2-8c15-32d959ab7ce3.png",
  "b5c1de95-b9ce-40ad-9875-9754158dc914.png",
  "63a9469c-c343-43cb-a6de-baf135e269bc.png",
  "3281b5df-ec59-4e46-a3f7-63b3bacb9163.png",
  "2da2d7cc-830e-42e6-916a-09975cb31eb9.png",
  "5a22ad17-4e18-4dd1-93b7-dd4af4d796aa.png",
]);

/** CDN masters uploaded under the wrong SKU folder (e.g. drum kit in cymbal slots). */
const MISASSIGNED_CATALOG_FILES = new Set(["e853f8d2-cfec-4a70-a7c8-ec3751205191.png"]);

function imageFileName(url: string): string {
  return url.split("/").pop()?.split("?")[0] ?? "";
}

export function cdnUrlProductSlug(url: string): string | null {
  if (!url) return null;
  try {
    const match = new URL(url).pathname.match(/\/products\/[^/]+\/([^/]+)\//);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isMisassignedCatalogImage(url: string): boolean {
  return MISASSIGNED_CATALOG_FILES.has(imageFileName(url));
}

function isValidCatalogImageRef(url: string): boolean {
  if (!url || url === "[object Object]") return false;
  if (isMisassignedCatalogImage(url)) return false;
  return true;
}

function isFlatPackshotCatalogImage(url: string): boolean {
  return FLAT_PACKSHOT_FILES.has(imageFileName(url));
}

/** True for top-down white-background catalog packshots that need a tinted well to read. */
export function isFlatPackshotImageUrl(url: string): boolean {
  return isFlatPackshotCatalogImage(url);
}

export function isBigNamesShowcaseUnfriendlyImage(url: string): boolean {
  return BIG_NAMES_SHOWCASE_UNFRIENDLY_FILES.has(imageFileName(url));
}

/**
 * Homepage Big Names row: prefer standing vertical lifestyle shots; when a SKU
 * only has flat packshots left, return the packshot (use multiply blend on ivory).
 */
export function pickBigNamesShowcaseImage(gallery: string[]): string {
  const eligible = gallery.filter((url) => !isBigNamesShowcaseUnfriendlyImage(url));
  const lifestyle = eligible.filter((url) => !isFlatPackshotCatalogImage(url));
  const cdnLifestyle = lifestyle.find((url) => isCdnUrl(url));
  if (cdnLifestyle) return cdnLifestyle;
  if (lifestyle[0]) return lifestyle[0];

  const packshot = eligible.find((url) => isFlatPackshotCatalogImage(url) && isCdnUrl(url));
  if (packshot) return packshot;

  const packshotAny = eligible.find((url) => isFlatPackshotCatalogImage(url));
  if (packshotAny) return packshotAny;

  return eligible[0] ?? gallery[0] ?? "";
}

function isCardFriendlyCatalogImage(url: string): boolean {
  const file = imageFileName(url);
  if (!file) return false;
  if (FLAT_PACKSHOT_FILES.has(file)) return false;
  if (WIDE_CARD_UNFRIENDLY_FILES.has(file)) return false;
  return true;
}

function flatPackshotCdnUrl(refs: string[]): string {
  return refs.find((url) => isCdnUrl(url) && isFlatPackshotCatalogImage(url)) ?? "";
}

function catalogImageRefs(input: ProductCardImageInput): string[] {
  const refs: string[] = [];
  const primary = input.image?.trim() ?? "";
  if (primary && isValidCatalogImageRef(primary)) refs.push(primary);

  if (input.images?.length) {
    for (const entry of input.images) {
      if (!entry) continue;
      const ref = typeof entry === "string" ? entry.trim() : (entry.src?.trim() ?? "");
      if (ref && isValidCatalogImageRef(ref) && !refs.includes(ref)) refs.push(ref);
    }
  }

  return refs.filter((ref) => !isDisallowedStorefrontImageUrl(ref));
}

function cdnUrlMatchesProductSlug(url: string, slug: string): boolean {
  if (url.startsWith("/images/")) return true;
  if (!isCdnUrl(url)) return true;
  const folderSlug = cdnUrlProductSlug(url);
  return folderSlug === slug;
}

function sortGalleryUrls(urls: string[]): string[] {
  const lifestyle = urls.filter((url) => !isFlatPackshotCatalogImage(url));
  const packshots = urls.filter((url) => isFlatPackshotCatalogImage(url));
  return [...lifestyle, ...packshots];
}

/**
 * PDP gallery URLs: prefer this product's CDN folder; allow cross-folder borrow
 * only when the SKU has no uploads yet. Never surface misassigned masters.
 * Lifestyle shots are ordered before flat packshots; packshot-only SKUs get
 * curated local art first so the hero frame is never a blank white circle.
 */
export function resolveProductGalleryUrls(input: ProductCardImageInput): string[] {
  const refs = catalogImageRefs(input);
  const ownFolder = refs.filter((url) => cdnUrlMatchesProductSlug(url, input.slug));
  const pool = ownFolder.length > 0 ? ownFolder : refs;
  const sorted = sortGalleryUrls(pool);
  if (sorted.length === 0) return [];

  if (sorted.every(isFlatPackshotCatalogImage)) {
    const fallback = productImageLocalFallback(input.slug, input.category);
    const list = fallback ? [fallback, ...sorted] : sorted;
    return list.map((item) => sanitizeStorefrontImageUrl(item));
  }

  return sorted.map((item) => sanitizeStorefrontImageUrl(item));
}

function pickCatalogImage(input: ProductCardImageInput): string {
  const refs = catalogImageRefs(input);
  if (refs.length === 0) return "";

  for (const candidate of refs) {
    if (isCardFriendlyCatalogImage(candidate)) {
      return candidate;
    }
  }

  // Flat top-down packshots read as blank circles in square cards — use curated
  // showcase art (same pattern as Shop the highlights / homepageTopProducts).
  if (refs.every(isFlatPackshotCatalogImage)) {
    return productImageLocalFallback(input.slug, input.category);
  }

  return refs[0] ?? "";
}

/** Category / slug art used when CDN derivatives fail to load. */
export function productImageLocalFallback(slug: string, category?: string): string {
  return getProductImage(slug, category);
}

/**
 * Primary card image plus a self-hosted fallback when the catalog uses CDN masters.
 */
export function resolveProductCardImage(input: ProductCardImageInput): {
  src: string;
  fallbackSrc: string;
} {
  const localFallback = productImageLocalFallback(input.slug, input.category);
  const refs = catalogImageRefs(input);
  const catalogImage = pickCatalogImage(input);
  const cdnFlatPackshot = flatPackshotCdnUrl(refs);

  if (!catalogImage) {
    return {
      src: sanitizeStorefrontImageUrl(localFallback),
      fallbackSrc: sanitizeStorefrontImageUrl(localFallback),
    };
  }

  if (catalogImage.startsWith("/images/")) {
    return {
      src: catalogImage,
      fallbackSrc: sanitizeStorefrontImageUrl(cdnFlatPackshot || localFallback),
    };
  }

  if (isCdnUrl(catalogImage)) {
    return {
      src: sanitizeStorefrontImageUrl(catalogImage) || localFallback,
      fallbackSrc: sanitizeStorefrontImageUrl(localFallback),
    };
  }

  return {
    src: sanitizeStorefrontImageUrl(catalogImage) || localFallback,
    fallbackSrc: sanitizeStorefrontImageUrl(localFallback),
  };
}
