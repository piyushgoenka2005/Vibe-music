const DEFAULT_CDN_PUBLIC_BASE_URL = "https://cdn.vibemusic.in";

/** Production CDN host always accepted (stored catalog URLs). */
const LEGACY_CDN_HOSTS = new Set(["cdn.vibemusic.in"]);

/** Public CDN base URL (client + server). Prefer NEXT_PUBLIC_* in bundled code. */
export function getCdnPublicBaseUrl(): string {
  const envBase =
    process.env.NEXT_PUBLIC_CDN_PUBLIC_BASE_URL?.trim() || process.env.CDN_PUBLIC_BASE_URL?.trim();
  return (envBase || DEFAULT_CDN_PUBLIC_BASE_URL).replace(/\/+$/, "");
}

export function getCdnHostname(): string {
  try {
    return new URL(getCdnPublicBaseUrl()).hostname;
  } catch {
    return "cdn.vibemusic.in";
  }
}

export function isCdnHostname(hostname: string): boolean {
  return hostname === getCdnHostname() || LEGACY_CDN_HOSTS.has(hostname);
}

export function isCdnUrl(url: string): boolean {
  if (!url) return false;
  try {
    return isCdnHostname(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Skip next/image optimizer for CDN assets and the local thumb proxy. */
export function shouldBypassNextImageOptimization(src: string): boolean {
  if (!src) return false;
  return isCdnUrl(src) || src.includes("/api/media/thumb");
}
