import "server-only";

import { cache } from "react";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { groupCatalogByBrand } from "@/lib/brands/groupCatalogByBrand";
import { getCachedBrands, getCachedHomepageProducts } from "@/lib/server/catalogSnapshotCache";
import { toProduct } from "@/services/catalogService";
import type { BrandDirectoryGroup, BrandWithCount } from "@/types/brandDirectory";

export type { BrandDirectoryGroup, BrandWithCount };

export const loadBrandDirectory = cache(async function loadBrandDirectory(): Promise<
  BrandDirectoryGroup[]
> {
  const [brands, catalog] = await Promise.all([getCachedBrands(), getCachedHomepageProducts()]);

  return groupCatalogByBrand(catalog, brands).map((group) => {
    const logoUrl = getBrandLogoUrl(group.slug);
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
});

export const loadBrandsWithCounts = cache(async function loadBrandsWithCounts(): Promise<
  BrandWithCount[]
> {
  const directory = await loadBrandDirectory();
  return directory.map(({ id, name, slug, productCount }) => ({
    id,
    name,
    slug,
    productCount,
  }));
});
