import { getProductImage } from "@/data/productImages";
import { isCdnUrl } from "@/lib/cdnConfig";

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
]);

/** Wide lifestyle uploads that crop to a tiny product in square cards. */
const WIDE_CARD_UNFRIENDLY_FILES = new Set(["e853f8d2-cfec-4a70-a7c8-ec3751205191.png"]);

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

  return refs;
}

function cdnUrlMatchesProductSlug(url: string, slug: string): boolean {
  if (url.startsWith("/images/")) return true;
  if (!isCdnUrl(url)) return true;
  const folderSlug = cdnUrlProductSlug(url);
  return folderSlug === slug;
}

/**
 * PDP gallery URLs: prefer this product's CDN folder; allow cross-folder borrow
 * only when the SKU has no uploads yet. Never surface misassigned masters.
 */
export function resolveProductGalleryUrls(input: ProductCardImageInput): string[] {
  const refs = catalogImageRefs(input);
  const ownFolder = refs.filter((url) => cdnUrlMatchesProductSlug(url, input.slug));
  if (ownFolder.length > 0) return ownFolder;
  return refs;
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
    return { src: localFallback, fallbackSrc: localFallback };
  }

  if (catalogImage.startsWith("/images/")) {
    return {
      src: catalogImage,
      fallbackSrc: cdnFlatPackshot || localFallback,
    };
  }

  if (isCdnUrl(catalogImage)) {
    return { src: catalogImage, fallbackSrc: localFallback };
  }

  return { src: catalogImage, fallbackSrc: localFallback };
}
