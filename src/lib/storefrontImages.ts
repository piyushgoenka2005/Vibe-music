import {
  buildMediaTransformUrl,
  MEDIA_PRESETS,
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

/** Absolute CDN URL for SEO surfaces (JSON-LD / OpenGraph) — crawlers must not hit our proxy. */
export function cdnSeoImageUrl(url: string): string {
  if (!url) return url;
  try {
    const absolute = unwrapStorefrontSrc(url);
    if (new URL(absolute).hostname === CDN_HOST) return cdnMasterUrl(absolute);
  } catch {
    /* fall through */
  }
  return url;
}

/**
 * Storefront display URL:
 * - Known CDN derivatives (`-wN.webp`) → rebuilt to the requested bucket
 * - WebP masters → prebuilt derivative bucket
 * - Legacy PNG/JPG masters (often 1–8 MB) → `/api/media/thumb` Sharp proxy
 *   which serves a cached WebP at the snapped width — never the raw master.
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

      // PNG/JPG masters are multi-MB uploads — resize via the cached thumb
      // proxy instead of shipping the raw master to every visitor.
      return {
        src: mediaThumbProxyUrl(master, snappedW),
        kind: "thumb",
      };
    }
  } catch {
    /* fall through */
  }
  return { src: url, kind: "direct" };
}

/** Local cached-resize endpoint for oversized CDN masters. */
function mediaThumbProxyUrl(absoluteUrl: string, width: number): string {
  return `/api/media/thumb?url=${encodeURIComponent(absoluteUrl)}&w=${width}`;
}

/**
 * If `url` is already an `/api/media/thumb?...` path, return nested CDN original.
 * Prevents double-optimization from dropping CDN fallbacks.
 */
function unwrapStorefrontSrc(url: string): string {
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
 * Served through the cached thumb proxy at the largest bucket — sharp enough
 * for zoom panes without pulling multi-MB masters over the wire.
 */
export function storefrontZoomImageUrl(url: string): string {
  if (!url) return url;
  try {
    const absolute = unwrapStorefrontSrc(url);
    if (new URL(absolute).hostname === CDN_HOST) {
      return mediaThumbProxyUrl(cdnMasterUrl(absolute), 1600);
    }
    const master = cdnMasterUrl(absolute);
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
