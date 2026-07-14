import "server-only";

import { unstable_cache } from "next/cache";
import { getPublicHomepageData as buildPublicHomepageData } from "@/lib/server/homepageService";
import type { PublicHomepageData } from "@/types/homepage";

const HOMEPAGE_REVALIDATE_SECONDS =
  Number(process.env.HOMEPAGE_CACHE_REVALIDATE_SECONDS) || 300;

async function loadPublicHomepageData(): Promise<PublicHomepageData> {
  return buildPublicHomepageData();
}

export const getCachedPublicHomepageData = unstable_cache(
  loadPublicHomepageData,
  ["public-homepage-data-v3"],
  { revalidate: HOMEPAGE_REVALIDATE_SECONDS, tags: ["homepage", "catalog"] }
);

export async function revalidateHomepageSnapshot(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("homepage", "max");
}
