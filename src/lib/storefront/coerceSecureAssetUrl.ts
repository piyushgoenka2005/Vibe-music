const PUBLIC_HTTP_UPGRADE_HOSTS = new Set(["cdn.vibemusic.in", "vibemusic.in", "www.vibemusic.in"]);

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

function defaultServerOrigin(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "").trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return "https://vibemusic.in";
  return undefined;
}

function pageOrigin(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin.replace(/\/+$/, "");
}

/**
 * Avoid mixed-content on HTTPS pages (common when local DB stores
 * `http://192.168.x.x:3000/cdn-local/...` but the storefront is opened over HTTPS).
 */
export function coerceSecureAssetUrl(url: string, options?: { pageOrigin?: string }): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("data:")) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  if (parsed.protocol !== "http:") return trimmed;

  const host = parsed.hostname.toLowerCase();
  if (PUBLIC_HTTP_UPGRADE_HOSTS.has(host)) {
    parsed.protocol = "https:";
    return parsed.toString();
  }

  const origin = options?.pageOrigin?.replace(/\/+$/, "") ?? pageOrigin() ?? defaultServerOrigin();

  const needsSameOrigin =
    Boolean(origin?.startsWith("https://")) &&
    (isPrivateOrLoopbackHost(host) || parsed.pathname.startsWith("/cdn-local"));

  if (needsSameOrigin && origin) {
    return `${origin}${parsed.pathname}${parsed.search}`;
  }

  return trimmed;
}
