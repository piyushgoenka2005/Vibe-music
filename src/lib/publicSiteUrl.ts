/**
 * Canonical public origin for emails, share links, and absolute URLs.
 * Prefer NEXT_PUBLIC_SITE_URL — never invent a different env var.
 */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    return "https://vibemusic.in";
  }

  return "http://localhost:3000";
}

/**
 * Public site URL for Next.js metadata / client routing.
 * In local dev, never use production hostname for metadataBase — that causes
 * `?_rsc=` fetches to https://vibemusic.in and 502 noise when PM2 is busy.
 */
export function resolveMetadataBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = configured || "https://vibemusic.in";

  if (process.env.NODE_ENV !== "development") {
    return fallback;
  }

  if (!configured || /vibemusic\.in/i.test(configured)) {
    const port = process.env.PORT?.trim() || "3000";
    return `http://localhost:${port}`;
  }

  return configured;
}
