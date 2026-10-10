import "server-only";

import { existsSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { revalidatePath, revalidateTag } from "next/cache";

/** Every unstable_cache tag that feeds a public page. */
export const STOREFRONT_CACHE_TAGS = [
  "catalog",
  "categories",
  "footer-trending",
  "product-detail",
  "product-merchandising",
  "homepage",
  "banners",
  "social-rail",
  "gear-stories",
  "blog",
  "store-settings",
  "public-legal",
] as const;

export type StorefrontCacheTag = (typeof STOREFRONT_CACHE_TAGS)[number];

/**
 * Admin API writes that change what shoppers see. Operational writes (orders status,
 * customers, support, notifications, auth, raw uploads) are deliberately excluded so
 * routine admin work does not keep cold-starting the storefront.
 */
const STOREFRONT_ADMIN_WRITE =
  /^\/api\/admin\/(products|categories|brands|inventory|taxonomy|reviews|questions|returns|banners|homepage|blog|cms|settings|shipping-zones|rentals|giveaway|compare)(\/|$)|^\/api\/admin\/orders\/[^/]+\/refund$/;

export function isStorefrontAdminWrite(pathname: string): boolean {
  return STOREFRONT_ADMIN_WRITE.test(pathname);
}

const versionStore = globalThis as typeof globalThis & { __vibeStorefrontVersion?: number };

/** Changes whenever storefront content is invalidated; open tabs poll it to refresh. */
export function getStorefrontVersion(): number {
  versionStore.__vibeStorefrontVersion ??= Date.now();
  return versionStore.__vibeStorefrontVersion;
}

export function bumpStorefrontVersion(): void {
  versionStore.__vibeStorefrontVersion = Math.max(Date.now(), getStorefrontVersion() + 1);
}

/**
 * `{ expire: 0 }` (not "max"): the next request blocks on fresh data instead of
 * serving one more stale render, so admin saves show up on the very next page load.
 */
export function expireStorefrontTags(tags: readonly StorefrontCacheTag[]): void {
  bumpStorefrontVersion();
  try {
    for (const tag of tags) revalidateTag(tag, { expire: 0 });
  } catch {
    /* outside a request context (CLI / workers) */
  }
}

const NGINX_PAGE_CACHE_DIR = process.env.NGINX_PAGE_CACHE_DIR ?? "/var/cache/nginx/vibe-pages";

/** nginx caches anonymous HTML (60–300s); drop it so the next visitor reaches Next.js. */
export async function purgeNginxPageCache(): Promise<void> {
  if (process.env.NODE_ENV !== "production" || !existsSync(NGINX_PAGE_CACHE_DIR)) return;
  try {
    const entries = await readdir(NGINX_PAGE_CACHE_DIR);
    await Promise.all(
      entries.map((entry) =>
        rm(path.join(NGINX_PAGE_CACHE_DIR, entry), { recursive: true, force: true }),
      ),
    );
  } catch (error) {
    console.warn("[storefront-cache] nginx page cache purge failed", error);
  }
}

async function clearProcessCaches(): Promise<void> {
  const [
    { invalidateHomepageCache },
    { invalidateRelatedProductsCache },
    { invalidateBundleCache },
    { invalidateCacheByPrefix },
  ] = await Promise.all([
    import("@/lib/server/homepage/homepageRepository"),
    import("@/lib/server/catalog/relatedProductsService"),
    import("@/lib/server/catalog/bundleService"),
    import("@/lib/server/platform/redisCache"),
  ]);
  invalidateHomepageCache();
  invalidateRelatedProductsCache();
  invalidateBundleCache();
  await invalidateCacheByPrefix("products");
}

/** Make every public page (and the admin views that read the same caches) fresh on next load. */
export async function invalidateAllStorefrontCaches(): Promise<void> {
  expireStorefrontTags(STOREFRONT_CACHE_TAGS);
  try {
    revalidatePath("/", "layout");
  } catch {
    /* outside a request context */
  }
  await Promise.all([
    clearProcessCaches().catch((error) =>
      console.warn("[storefront-cache] process cache clear failed", error),
    ),
    purgeNginxPageCache(),
  ]);
}
