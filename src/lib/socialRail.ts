import { SOCIAL_LINKS } from "@/lib/socialLinks";
import type { HomepageSection, HomepageSectionItem } from "@/types/homepage";

export const SOCIAL_RAIL_PLATFORMS = [
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
  "youtube",
] as const;

export type SocialRailPlatform = (typeof SOCIAL_RAIL_PLATFORMS)[number];

export const SOCIAL_RAIL_PLATFORM_LABELS: Record<SocialRailPlatform, string> = {
  facebook: "Facebook",
  twitter: "X (Twitter)",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

export interface SocialRailLink {
  platform: SocialRailPlatform;
  label: string;
  href: string;
}

export interface SocialRailNewsletter {
  label: string;
  href: string;
}

export interface SocialRailPublicConfig {
  isActive: boolean;
  links: SocialRailLink[];
  newsletter: SocialRailNewsletter | null;
}

export function normalizeSocialRailPlatform(
  value: string | undefined | null,
): SocialRailPlatform | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  return (SOCIAL_RAIL_PLATFORMS as readonly string[]).includes(key)
    ? (key as SocialRailPlatform)
    : null;
}

export function getDefaultSocialRailConfig(): SocialRailPublicConfig {
  return {
    isActive: true,
    newsletter: {
      label: "Newsletter",
      href: SOCIAL_LINKS.newsletter,
    },
    links: SOCIAL_RAIL_PLATFORMS.map((platform) => ({
      platform,
      label: SOCIAL_RAIL_PLATFORM_LABELS[platform],
      href: SOCIAL_LINKS[platform],
    })),
  };
}

export function buildSocialRailConfig(
  section: HomepageSection | null | undefined,
  items: HomepageSectionItem[],
): SocialRailPublicConfig {
  const defaults = getDefaultSocialRailConfig();

  if (!section?.isActive) {
    return { isActive: false, links: [], newsletter: null };
  }

  const links = items
    .map((item) => {
      const platform = normalizeSocialRailPlatform(item.customTitle);
      const href = item.customHref?.trim();
      if (!platform || !href) return null;
      return {
        platform,
        label: SOCIAL_RAIL_PLATFORM_LABELS[platform],
        href,
      };
    })
    .filter((link): link is SocialRailLink => link !== null);

  const newsletterLabel = section.ctaText?.trim();
  const newsletter =
    newsletterLabel && newsletterLabel.length > 0
      ? {
          label: newsletterLabel,
          href: section.ctaLink?.trim() || defaults.newsletter?.href || "#newsletter",
        }
      : null;

  return {
    isActive: true,
    links: links.length > 0 ? links : defaults.links,
    newsletter: newsletter ?? defaults.newsletter,
  };
}

export const DEFAULT_SOCIAL_RAIL_ITEMS: Array<{
  id: string;
  platform: SocialRailPlatform;
  href: string;
}> = SOCIAL_RAIL_PLATFORMS.map((platform) => ({
  id: `social-rail-${platform}`,
  platform,
  href: SOCIAL_LINKS[platform],
}));
