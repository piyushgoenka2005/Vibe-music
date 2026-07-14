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
