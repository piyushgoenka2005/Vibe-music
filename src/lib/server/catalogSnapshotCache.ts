import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  fetchAllProducts as fetchAllProductsFromDb,
  fetchBrands as fetchBrandsFromDb,
  fetchHomepageCatalogProducts,
} from "@/lib/server/prisma/catalogRepository";
import type { Brand } from "@/types/brand";
import type { CatalogProduct } from "@/types/catalog";

const CATALOG_REVALIDATE_SECONDS = Number(process.env.CATALOG_CACHE_REVALIDATE_SECONDS) || 300;

async function loadActiveProducts(): Promise<CatalogProduct[]> {
  return fetchAllProductsFromDb(false);
}

async function loadAllProducts(): Promise<CatalogProduct[]> {
  return fetchAllProductsFromDb(true);
}

async function loadHomepageProducts(): Promise<CatalogProduct[]> {
  return fetchHomepageCatalogProducts();
}

const getCachedActiveProductsInner = unstable_cache(
  loadActiveProducts,
  ["catalog-active-products-v3"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["catalog"] },
);

const getCachedHomepageProductsInner = unstable_cache(
  loadHomepageProducts,
  ["catalog-homepage-products-v1"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["catalog"] },
);

const getCachedAllProductsInner = unstable_cache(loadAllProducts, ["catalog-all-products-v3"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["catalog"],
});

export const getCachedActiveProducts = cache(() => getCachedActiveProductsInner());

/** Homepage / marquee lean catalog — preferred for storefront landing. */
export const getCachedHomepageProducts = cache(() => getCachedHomepageProductsInner());

export const getCachedAllProducts = cache(() => getCachedAllProductsInner());

const CATEGORY_REVALIDATE_SECONDS =
  Number(process.env.CATEGORY_CACHE_REVALIDATE_SECONDS) || CATALOG_REVALIDATE_SECONDS;

async function loadCategories() {
  const { fetchCategories } = await import("@/lib/server/prisma/catalogRepository");
  return fetchCategories();
}

const getCachedCategoriesInner = unstable_cache(loadCategories, ["catalog-categories"], {
  revalidate: CATEGORY_REVALIDATE_SECONDS,
  tags: ["catalog", "categories"],
});

export const getCachedCategories = cache(() => getCachedCategoriesInner());

async function loadBrands(): Promise<Brand[]> {
  return fetchBrandsFromDb();
}

const getCachedBrandsInner = unstable_cache(loadBrands, ["catalog-brands-v1"], {
  revalidate: CATEGORY_REVALIDATE_SECONDS,
  tags: ["catalog"],
});

export const getCachedBrands = cache(() => getCachedBrandsInner());

export async function getCachedProducts(includeInactive = false): Promise<CatalogProduct[]> {
  return includeInactive ? getCachedAllProducts() : getCachedActiveProducts();
}

export async function revalidateCatalogSnapshot(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("catalog", "max");
  revalidateTag("categories", "max");
}
