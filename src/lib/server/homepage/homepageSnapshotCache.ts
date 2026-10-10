import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getPublicHomepageData as buildPublicHomepageData } from "@/lib/server/homepageService";
import { getBigNamesDealsPublicData as buildBigNamesDealsPublicData } from "@/lib/server/homepageService";
import { getHomepageStoryBanners as buildHomepageStoryBanners } from "@/lib/server/homepageStoryService";
import type { PublicBigNamesDealsData, PublicHomepageData } from "@/types/homepage";
import type { HomepageStoryBannersData } from "@/lib/server/homepageStoryService";

const HOMEPAGE_REVALIDATE_SECONDS = Number(process.env.HOMEPAGE_CACHE_REVALIDATE_SECONDS) || 60;

async function loadPublicHomepageData(): Promise<PublicHomepageData> {
  return buildPublicHomepageData();
}

export const getCachedPublicHomepageData = unstable_cache(
  loadPublicHomepageData,
  ["public-homepage-data-v9"],
  { revalidate: HOMEPAGE_REVALIDATE_SECONDS, tags: ["homepage", "catalog"] },
);

export const getCachedBigNamesDealsPublicData = unstable_cache(
  async (): Promise<PublicBigNamesDealsData> => buildBigNamesDealsPublicData(),
  ["public-big-names-deals-v5"],
  { revalidate: HOMEPAGE_REVALIDATE_SECONDS, tags: ["homepage", "catalog"] },
);

export const getCachedHomepageStoryBanners = unstable_cache(
  async (): Promise<HomepageStoryBannersData> => buildHomepageStoryBanners(),
  ["public-homepage-story-banners-v3"],
  { revalidate: HOMEPAGE_REVALIDATE_SECONDS, tags: ["homepage"] },
);

export async function revalidateHomepageSnapshot(): Promise<void> {
  try {
    const { revalidateStorefrontPresentationCaches } =
      await import("@/lib/server/storefront/storefrontPresentationCache");
    revalidateStorefrontPresentationCaches();
    revalidatePath("/admin/homepage");
  } catch {
    /* ignore outside request context (scripts / tests) */
  }
}
