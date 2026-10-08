import "server-only";

import { unstable_cache } from "next/cache";
import {
  buildDefaultGearStoriesSectionData,
  buildGearStoriesConfig,
} from "@/lib/gearStoriesConfig";
import { ensureMissingHomepageSections } from "@/lib/server/prisma/contentRepository";
import { getSectionByKey, listActiveSectionItems } from "@/lib/server/homepage/homepageRepository";
import { fetchProductsByIds, isCatalogUnavailable } from "@/lib/server/storeCatalogRepository";
import type { CatalogProduct } from "@/types/catalog";
import type { GearStoriesSectionData } from "@/types/gear-story";

async function resolveProductsForItems(productIds: string[]): Promise<Map<string, CatalogProduct>> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  try {
    if (isCatalogUnavailable()) {
      const { loadProducts } = await import("@/lib/server/catalogRepository");
      const local = loadProducts();
      const byId = new Map(local.map((product) => [product.id, product]));
      return new Map(uniqueIds.flatMap((id) => (byId.has(id) ? [[id, byId.get(id)!]] : [])));
    }

    const products = await fetchProductsByIds(uniqueIds);
    return new Map(products.map((product) => [product.id, product]));
  } catch {
    return new Map();
  }
}

export async function listGearStories(): Promise<GearStoriesSectionData> {
  try {
    await ensureMissingHomepageSections();
    const section = await getSectionByKey("gear_stories");
    const items = await listActiveSectionItems("gear_stories");
    const productIds = items
      .map((item) => item.productId)
      .filter((id): id is string => Boolean(id));
    const productsById = await resolveProductsForItems(productIds);

    return buildGearStoriesConfig(section, items, productsById);
  } catch {
    return buildDefaultGearStoriesSectionData();
  }
}

const GEAR_STORIES_REVALIDATE_SECONDS = Number(process.env.HOMEPAGE_CACHE_REVALIDATE_SECONDS) || 60;

export const getCachedGearStories = unstable_cache(listGearStories, ["gear-stories-section-v3"], {
  revalidate: GEAR_STORIES_REVALIDATE_SECONDS,
  tags: ["gear-stories", "homepage", "catalog"],
});

/** Back-compat for tests — maps products to seed order. */
export async function buildStaticGearStories(
  products?: Array<CatalogProduct | undefined>,
): Promise<GearStoriesSectionData> {
  return buildDefaultGearStoriesSectionData(products);
}

/** Alias for GET /api/reels */
export const listReels = listGearStories;
