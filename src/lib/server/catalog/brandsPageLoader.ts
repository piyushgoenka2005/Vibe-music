import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { groupCatalogByBrand } from "@/lib/brands/groupCatalogByBrand";
import { getCachedBrands, getCachedHomepageProducts } from "@/lib/server/catalogSnapshotCache";
import { toProduct } from "@/services/catalogService";
import type { BrandDirectoryGroup, BrandWithCount } from "@/types/brandDirectory";

export type { BrandDirectoryGroup, BrandWithCount };

async function loadBrandDirectoryUncached(): Promise<BrandDirectoryGroup[]> {
  const [brands, catalog] = await Promise.all([getCachedBrands(), getCachedHomepageProducts()]);

  return groupCatalogByBrand(catalog, brands).map((group) => {
    const logoUrl = getBrandLogoUrl(group.slug) ?? group.products[0]?.image;
    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      productCount: group.products.length,
      letter: group.letter,
      ...(logoUrl ? { logoUrl } : {}),
      products: group.products.map(toProduct),
    };
  });
}

const getCachedBrandDirectory = unstable_cache(loadBrandDirectoryUncached, ["brand-directory-v2"], {
  revalidate: 300,
  tags: ["catalog", "brands"],
});

export const loadBrandDirectory = cache(async function loadBrandDirectory(): Promise<
  BrandDirectoryGroup[]
> {
  return getCachedBrandDirectory();
});

const getCachedBrandsWithCounts = unstable_cache(
  async function loadBrandsWithCountsUncached(): Promise<BrandWithCount[]> {
    const directory = await getCachedBrandDirectory();
    return directory.map(({ id, name, slug, productCount }) => ({
      id,
      name,
      slug,
      productCount,
    }));
  },
  ["brands-with-counts-v2"],
  { revalidate: 300, tags: ["catalog", "brands"] },
);

export const loadBrandsWithCounts = cache(async function loadBrandsWithCounts(): Promise<
  BrandWithCount[]
> {
  try {
    return await getCachedBrandsWithCounts();
  } catch (error) {
    console.error("[brandsPageLoader] loadBrandsWithCounts error:", error);
    return [];
  }
});

export async function resolveBrandBySlug(slug: string): Promise<BrandDirectoryGroup | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const directory = await loadBrandDirectory();
  return directory.find((brand) => brand.slug.toLowerCase() === normalized) ?? null;
}
