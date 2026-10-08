import "server-only";

import { unstable_cache } from "next/cache";
import { getSocialRailPublicConfig } from "@/lib/server/socialRailService";
import type { SocialRailPublicConfig } from "@/lib/socialRail";

const SOCIAL_RAIL_REVALIDATE_SECONDS = Number(process.env.HOMEPAGE_CACHE_REVALIDATE_SECONDS) || 60;

export const getCachedSocialRailConfig = unstable_cache(
  async (): Promise<SocialRailPublicConfig> => getSocialRailPublicConfig(),
  ["public-social-rail-config-v1"],
  { revalidate: SOCIAL_RAIL_REVALIDATE_SECONDS, tags: ["homepage", "social-rail"] },
);
