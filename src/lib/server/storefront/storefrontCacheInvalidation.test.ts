import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  revalidateTag,
  revalidatePath,
  invalidateHomepageCache,
  invalidateRelatedProductsCache,
  invalidateBundleCache,
  invalidateCacheByPrefix,
} = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  invalidateHomepageCache: vi.fn(),
  invalidateRelatedProductsCache: vi.fn(),
  invalidateBundleCache: vi.fn(),
  invalidateCacheByPrefix: vi.fn(async () => undefined),
}));

vi.mock("next/cache", () => ({ revalidateTag, revalidatePath }));
vi.mock("@/lib/server/homepage/homepageRepository", () => ({ invalidateHomepageCache }));
vi.mock("@/lib/server/catalog/relatedProductsService", () => ({ invalidateRelatedProductsCache }));
vi.mock("@/lib/server/catalog/bundleService", () => ({ invalidateBundleCache }));
vi.mock("@/lib/server/platform/redisCache", () => ({ invalidateCacheByPrefix }));

import {
  STOREFRONT_CACHE_TAGS,
  expireStorefrontTags,
  getStorefrontVersion,
  invalidateAllStorefrontCaches,
  isStorefrontAdminWrite,
} from "./storefrontCacheInvalidation";

describe("isStorefrontAdminWrite", () => {
  it.each([
    "/api/admin/products",
    "/api/admin/products/abc123",
    "/api/admin/products/abc123/images",
    "/api/admin/categories/guitars",
    "/api/admin/brands",
    "/api/admin/inventory/adjust",
    "/api/admin/homepage",
    "/api/admin/banners/1",
    "/api/admin/blog/post-1",
    "/api/admin/cms/pages/shipping",
    "/api/admin/settings",
    "/api/admin/reviews/r1",
    "/api/admin/orders/o1/refund",
  ])("treats %s as storefront-affecting", (pathname) => {
    expect(isStorefrontAdminWrite(pathname)).toBe(true);
  });

  it.each([
    "/api/admin/orders/o1",
    "/api/admin/orders/o1/status",
    "/api/admin/customers/c1",
    "/api/admin/support/tickets",
    "/api/admin/upload",
    "/api/admin/productsx",
    "/api/products",
  ])("ignores operational write %s", (pathname) => {
    expect(isStorefrontAdminWrite(pathname)).toBe(false);
  });
});

describe("expireStorefrontTags", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expires tags immediately instead of stale-while-revalidate", () => {
    expireStorefrontTags(["catalog", "homepage"]);
    expect(revalidateTag).toHaveBeenCalledWith("catalog", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("homepage", { expire: 0 });
  });

  it("bumps the storefront version so open tabs refresh", () => {
    const before = getStorefrontVersion();
    expireStorefrontTags(["catalog"]);
    expect(getStorefrontVersion()).toBeGreaterThan(before);
  });

  it("swallows errors outside a request context", () => {
    revalidateTag.mockImplementationOnce(() => {
      throw new Error("Invariant: static generation store missing");
    });
    expect(() => expireStorefrontTags(["catalog"])).not.toThrow();
  });
});

describe("invalidateAllStorefrontCaches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expires every storefront tag, the layout path, and in-process caches", async () => {
    await invalidateAllStorefrontCaches();
    for (const tag of STOREFRONT_CACHE_TAGS) {
      expect(revalidateTag).toHaveBeenCalledWith(tag, { expire: 0 });
    }
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(invalidateHomepageCache).toHaveBeenCalled();
    expect(invalidateRelatedProductsCache).toHaveBeenCalled();
    expect(invalidateBundleCache).toHaveBeenCalled();
    expect(invalidateCacheByPrefix).toHaveBeenCalledWith("products");
  });
});
