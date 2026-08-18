import {
  buildMediaTransformUrl,
  MEDIA_PRESETS,
  type MediaTransformOptions,
} from "@/lib/media-url";

const CDN_HOST = "cdn.vibemusic.in";
/** Shared thumb buckets — include zoom/PDP sizes for sharp hover zoom. */
const THUMB_WIDTHS = [320, 480, 800, 960, 1600] as const;
const DERIVATIVE_FILE_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-w(\d+)\.webp$/i;

export function snapStorefrontThumbWidth(width: number): number {
  const w = Number.isFinite(width) ? Math.floor(width) : 480;
  const next = THUMB_WIDTHS.find((bucket) => bucket >= w);
  return next ?? THUMB_WIDTHS[THUMB_WIDTHS.length - 1]!;
}

/**
 * Convert a CDN card derivative (`{uuid}-w480.webp`) back to the upload master
 * (`{uuid}.webp`) so zoom / PDP can load real high-res detail.
 */
export function cdnMasterUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== CDN_HOST) return url;
    const file = parsed.pathname.split("/").pop() ?? "";
    const match = file.match(DERIVATIVE_FILE_RE);
    if (!match?.[1]) return url;
    const dir = parsed.pathname.slice(0, parsed.pathname.lastIndexOf("/") + 1);
    return `${parsed.origin}${dir}${match[1]}.webp`;
  } catch {
    return url;
  }
}

/**
 * Prefer CDN upload-time derivatives (`{uuid}-wN.webp`) when the URL already
 * points at a sized asset. Never invent missing larger `-wN` files.
 */
export function cdnDerivativeUrl(url: string, width = 400): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== CDN_HOST) return null;
    const file = parsed.pathname.split("/").pop() ?? "";
    const match = file.match(DERIVATIVE_FILE_RE);
    if (!match?.[1] || !match[2]) return null;
    const existingW = Number(match[2]);
    if (!Number.isFinite(existingW)) return null;

    // Existing derivative is large enough for this request.
    if (existingW >= width * 0.85) {
      return url;
    }

    // Need a larger prebuilt size — do not invent it.
    return null;
  } catch {
    return null;
  }
}

/**
 * Storefront display URL:
 * - Known CDN derivatives (`-wN.webp`) → CDN when large enough
 * - Undersized derivatives → thumb from CDN master (not from the tiny card file)
 * - Legacy CDN masters → `/api/media/thumb`
 * - Other hosts → as-is (Cloudinary transforms applied upstream)
 */
export function storefrontImageUrl(
  url: string,
  width = 640
): { src: string; kind: "derivative" | "thumb" | "direct" } {
  if (!url) return { src: url, kind: "direct" };
  try {
    const host = new URL(url).hostname;
    
    // Cloudinary: Inject WebP/AVIF auto-formatting directly
    if (host === "res.cloudinary.com") {
      const transformed = buildMediaTransformUrl(url, { width, quality: "auto", format: "auto" });
      return { src: transformed, kind: "direct" };
    }

    if (host === CDN_HOST) {
      // Implement CDN paths properly: Always rebuild the derivative URL to the requested bucket
      const snappedW = snapStorefrontThumbWidth(width);
      const master = cdnMasterUrl(url);
      const parsed = new URL(master);
      const file = parsed.pathname.split("/").pop() ?? "";
      const match = file.match(/^(.+)\.([a-z0-9]+)$/i);
      
      if (match && match[2].toLowerCase() === "webp") {
        const dir = parsed.pathname.slice(0, parsed.pathname.lastIndexOf("/") + 1);
        const name = match[1];
        return {
          src: `${parsed.origin}${dir}${name}-w${snappedW}.webp`,
          kind: "derivative"
        };
      }
      
      // Fallback: If it's a .png or .jpg on CDN, return the master directly.
      // The Next.js <Image> component will optimize it, or the browser will load the original.
      return {
        src: master,
        kind: "direct",
      };
    }
  } catch {
    /* fall through */
  }
  return { src: url, kind: "direct" };
}

/**
 * If `url` is already an `/api/media/thumb?...` path, return nested CDN original.
 * Prevents double-optimization from dropping CDN fallbacks.
 */
export function unwrapStorefrontSrc(url: string): string {
  if (!url) return url;
  try {
    const absolute = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : "http://localhost"
    );
    if (absolute.pathname === "/api/media/thumb") {
      const nested = absolute.searchParams.get("url")?.trim();
      if (nested) return nested;
    }
  } catch {
    /* ignore */
  }
  return url;
}

/**
 * High-res URL for PDP hover zoom / lightbox.
 * Prefer the CDN upload master directly (sharpest; avoids thumb API races).
 */
export function storefrontZoomImageUrl(url: string): string {
  if (!url) return url;
  try {
    const master = cdnMasterUrl(unwrapStorefrontSrc(url));
    if (new URL(master).hostname === CDN_HOST) return master;
  } catch {
    /* fall through */
  }
  return storefrontImageUrl(unwrapStorefrontSrc(url), 1600).src;
}

/**
 * Display candidates for a product image: optimized thumb first, then CDN/original.
 */
export function storefrontImageCandidates(
  url: string,
  width = 1200
): string[] {
  if (!url) return [];
  const original = unwrapStorefrontSrc(url);
  const preferred = storefrontImageUrl(original, width).src;
  return Array.from(new Set([preferred, original].filter(Boolean)));
}

/** Resize CDN masters via derivative rewrite or local Sharp proxy. */
export function cdnThumbUrl(url: string, width = 640): string {
  return storefrontImageUrl(url, width).src;
}

export function optimizeImageUrl(
  url: string,
  preset: keyof typeof MEDIA_PRESETS = "productCard"
): string {
  if (!url) return url;
  const options = MEDIA_PRESETS[preset];
  const transformed = buildMediaTransformUrl(url, options);
  return storefrontImageUrl(transformed, options.width ?? 640).src;
}

export function optimizeImage(
  url: string,
  options: MediaTransformOptions
): string {
  if (!url) return url;
  const transformed = buildMediaTransformUrl(url, options);
  return storefrontImageUrl(transformed, options.width ?? 640).src;
}
