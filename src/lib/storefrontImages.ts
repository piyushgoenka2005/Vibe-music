import { buildMediaTransformUrl, MEDIA_PRESETS } from "@/lib/media-url";
import { getCdnHostname, isCdnHostname } from "@/lib/cdnConfig";

/** Shared thumb buckets supported across all catalog uploads. */
const THUMB_WIDTHS = [480, 960, 1600] as const;

function cdnPathExtension(url: string): string {
  try {
    const file = new URL(url).pathname.split("/").pop() ?? "";
    const dot = file.lastIndexOf(".");
    return dot >= 0 ? file.slice(dot + 1).toLowerCase() : "";
  } catch {
    return "";
  }
}

function isCdnLegacyRaster(url: string): boolean {
  const ext = cdnPathExtension(url);
  return ext === "png" || ext === "jpg" || ext === "jpeg";
}

function thumbProxyUrl(url: string, width: number): string {
  const snappedW = snapStorefrontThumbWidth(width);
  return `/api/media/thumb?url=${encodeURIComponent(url)}&w=${snappedW}`;
}
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
    if (!isCdnHostname(parsed.hostname)) return url;
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
    if (isCdnHostname(new URL(absolute).hostname)) return cdnMasterUrl(absolute);
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
  width = 640,
): { src: string; kind: "derivative" | "thumb" | "direct" } {
  if (!url) return { src: url, kind: "direct" };
  try {
    const host = new URL(url).hostname;

    // Cloudinary: Inject WebP/AVIF auto-formatting directly
    if (host === "res.cloudinary.com") {
      const transformed = buildMediaTransformUrl(url, { width, quality: "auto", format: "auto" });
      return { src: transformed, kind: "direct" };
    }

    if (isCdnHostname(host)) {
      const snappedW = snapStorefrontThumbWidth(width);
      const master = cdnMasterUrl(url);
      if (isCdnLegacyRaster(master)) {
        return { src: thumbProxyUrl(master, snappedW), kind: "thumb" };
      }

      const parsed = new URL(master);
      const file = parsed.pathname.split("/").pop() ?? "";
      const match = file.match(/^(.+)\.([a-z0-9]+)$/i);

      if (match) {
        const dir = parsed.pathname.slice(0, parsed.pathname.lastIndexOf("/") + 1);
        const name = match[1];
        return {
          src: `${parsed.origin}${dir}${name}-w${snappedW}.webp`,
          kind: "derivative",
        };
      }
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
function unwrapStorefrontSrc(url: string): string {
  if (!url) return url;
  try {
    const absolute = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : "http://localhost",
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
 * Legacy PNG/JPG → thumb proxy at 1600w; WebP pipeline → static CDN derivative.
 */
export function storefrontZoomImageUrl(url: string): string {
  if (!url) return url;
  try {
    const absolute = unwrapStorefrontSrc(url);
    if (isCdnHostname(new URL(absolute).hostname)) {
      const master = cdnMasterUrl(absolute);
      if (isCdnLegacyRaster(master)) {
        return thumbProxyUrl(master, 1600);
      }
      const parsed = new URL(master);
      const file = parsed.pathname.split("/").pop() ?? "";
      const match = file.match(/^(.+)\.([a-z0-9]+)$/i);
      if (match) {
        const dir = parsed.pathname.slice(0, parsed.pathname.lastIndexOf("/") + 1);
        const name = match[1];
        return `${parsed.origin}${dir}${name}-w1600.webp`;
      }
    }
  } catch {
    /* fall through */
  }
  return storefrontImageUrl(unwrapStorefrontSrc(url), 1600).src;
}

/**
 * Display candidates for a product image: largest snapped bucket first, then smaller
 * CDN derivatives (many uploads only have -w480), then the stored URL.
 */
export function storefrontImageCandidates(
  url: string,
  width = 1200,
  extraFallbacks: string[] = [],
): string[] {
  if (!url) return Array.from(new Set(extraFallbacks.filter(Boolean)));

  const original = unwrapStorefrontSrc(url);
  const candidates: string[] = [];

  try {
    if (isCdnHostname(new URL(original).hostname)) {
      const snappedW = snapStorefrontThumbWidth(width);
      if (isCdnLegacyRaster(original)) {
        candidates.push(thumbProxyUrl(original, snappedW));
        candidates.push(original);
      } else {
        const targetBucket = snappedW as (typeof THUMB_WIDTHS)[number];
        const startIdx = THUMB_WIDTHS.indexOf(targetBucket);
        if (startIdx >= 0) {
          for (const bucket of THUMB_WIDTHS.slice(0, startIdx + 1)) {
            candidates.push(storefrontImageUrl(original, bucket).src);
          }
        }
        candidates.push(original);
      }
    } else {
      candidates.push(storefrontImageUrl(original, width).src);
      candidates.push(original);
    }
  } catch {
    candidates.push(storefrontImageUrl(original, width).src);
    candidates.push(original);
  }

  return Array.from(new Set([...candidates, ...extraFallbacks].filter(Boolean)));
}

/** Resize CDN masters via derivative rewrite or local Sharp proxy. */
export function cdnThumbUrl(url: string, width = 640): string {
  return storefrontImageUrl(url, width).src;
}

export function optimizeImageUrl(
  url: string,
  preset: keyof typeof MEDIA_PRESETS = "productCard",
): string {
  if (!url) return url;
  const options = MEDIA_PRESETS[preset];
  const transformed = buildMediaTransformUrl(url, options);
  return storefrontImageUrl(transformed, options.width ?? 640).src;
}

/** @internal exported for tests */
export const __cdnHostForTests = getCdnHostname;
