/** Max products assignable to a single product-scoped coupon (ad campaign limit). */
export const MAX_COUPON_PRODUCT_URLS = 10;

/**
 * Extract a catalog product slug from a pasted storefront URL or raw slug.
 *
 * Accepts:
 * - https://vibemusic.in/product/fender-strat
 * - /product/fender-strat
 * - fender-strat
 */
export function parseProductSlugFromInput(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const asUrl = raw.startsWith("http") ? new URL(raw) : new URL(raw, "https://vibemusic.in");
    const match = asUrl.pathname.match(/\/product\/([^/?#]+)/i);
    if (match?.[1]) {
      return decodeURIComponent(match[1]).trim().toLowerCase();
    }
  } catch {
    /* not a URL — fall through */
  }

  const pathMatch = raw.match(/^\/?product\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]).trim().toLowerCase();
  }

  if (/^[a-z0-9][a-z0-9-]*$/i.test(raw) && !raw.includes(" ")) {
    return raw.toLowerCase();
  }

  return null;
}

/** Split multiline / comma-separated paste into unique slug candidates (max limit). */
export function parseProductSlugList(text: string, limit = MAX_COUPON_PRODUCT_URLS): string[] {
  const parts = text
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const slugs: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const slug = parseProductSlugFromInput(part);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length >= limit) break;
  }

  return slugs;
}
