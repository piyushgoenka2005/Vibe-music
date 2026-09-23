import "server-only";

import { buildSocialRailConfig, getDefaultSocialRailConfig } from "@/lib/socialRail";
import { ensureMissingHomepageSections } from "@/lib/server/prisma/contentRepository";
import { getSectionByKey, listActiveSectionItems } from "@/lib/server/homepageRepository";
import type { SocialRailPublicConfig } from "@/lib/socialRail";

export async function getSocialRailPublicConfig(): Promise<SocialRailPublicConfig> {
  try {
    await ensureMissingHomepageSections();
    const section = await getSectionByKey("social_rail");
    if (!section) return getDefaultSocialRailConfig();

    const items = await listActiveSectionItems("social_rail");
    return buildSocialRailConfig(section, items);
  } catch {
    return getDefaultSocialRailConfig();
  }
}
