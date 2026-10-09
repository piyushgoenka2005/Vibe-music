import { SOCIAL_LINKS } from "@/lib/socialLinks";
import {
  getDefaultSocialRailConfig,
  SOCIAL_RAIL_PLATFORMS,
  SOCIAL_RAIL_PLATFORM_LABELS,
  type SocialRailPlatform,
} from "@/lib/socialRail";

export type FooterSocialLink = {
  platform: SocialRailPlatform;
  href: string;
  label: string;
};

/** Same order as the desktop social rail — shown in the mobile footer band. */
export function getFooterSocialLinks(): FooterSocialLink[] {
  const defaults = getDefaultSocialRailConfig();
  const byPlatform = new Map(defaults.links.map((link) => [link.platform, link]));
  return SOCIAL_RAIL_PLATFORMS.map((platform) => {
    const link = byPlatform.get(platform);
    return {
      platform,
      href: link?.href ?? "",
      label: SOCIAL_RAIL_PLATFORM_LABELS[platform],
    };
  }).filter((link) => link.href.length > 0);
}

export function getFooterNewsletterHref(): string {
  const href =
    getDefaultSocialRailConfig().newsletter?.href?.trim() ||
    SOCIAL_LINKS.newsletter?.trim() ||
    "#newsletter";
  return href.startsWith("#") || href.startsWith("/") ? href : "#newsletter";
}

export function getFooterNewsletterLabel(): string {
  return getDefaultSocialRailConfig().newsletter?.label?.trim() || "Newsletter";
}
