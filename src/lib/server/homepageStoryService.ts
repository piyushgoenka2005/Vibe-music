import "server-only";

import type { AplusStoryBanner } from "@/components/common/AplusStoryBanners";
import { HOMEPAGE_APLUS_BANNERS } from "@/data/homepageAplusSections";
import {
  getSectionByKey,
  listSectionItems,
  isHomepageItemScheduledActive,
} from "@/lib/server/homepageRepository";

export interface HomepageStoryBannersData {
  isActive: boolean;
  sectionTitle: string;
  banners: AplusStoryBanner[];
}

/**
 * Retrieves story banners for the landing page.
 * Respects admin configuration, scheduling, and active state.
 * Falls back seamlessly to HOMEPAGE_APLUS_BANNERS when no custom items are configured.
 */
export async function getHomepageStoryBanners(): Promise<HomepageStoryBannersData> {
  try {
    const section = await getSectionByKey("featured_stories");
    if (section && !section.isActive) {
      return {
        isActive: false,
        sectionTitle: section.title,
        banners: [],
      };
    }

    const items = await listSectionItems("featured_stories");
    const now = new Date();
    const activeItems = items.filter(
      (item) => item.isActive && isHomepageItemScheduledActive(item, now),
    );

    if (activeItems.length > 0) {
      const banners: AplusStoryBanner[] = activeItems.map((item) => ({
        id: item.id,
        imageSrc: item.customImage || "/images/guitar-1.webp",
        imageAlt: item.customTitle || "Featured gear story",
        href: item.customHref || undefined,
      }));

      return {
        isActive: true,
        sectionTitle: section?.title || "Featured Gear Stories",
        banners,
      };
    }
  } catch {
    // Fail safe to approved static banners
  }

  return {
    isActive: true,
    sectionTitle: "Featured Gear Stories",
    banners: HOMEPAGE_APLUS_BANNERS,
  };
}
