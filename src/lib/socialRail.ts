import { BRAND } from "@/lib/brand";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import type { HomepageSection, HomepageSectionItem } from "@/types/homepage";

export const SOCIAL_RAIL_PLATFORMS = [
  "whatsapp",
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
  "youtube",
] as const;

export type SocialRailPlatform = (typeof SOCIAL_RAIL_PLATFORMS)[number];

export const SOCIAL_RAIL_PLATFORM_LABELS: Record<SocialRailPlatform, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

function getDefaultSocialRailHref(platform: SocialRailPlatform): string {
  if (platform === "whatsapp") return BRAND.whatsappUrl;
  return SOCIAL_LINKS[platform];
}

const PLATFORM_HOST_HINTS: Record<SocialRailPlatform, string[]> = {
  whatsapp: ["whatsapp.com", "wa.me"],
  facebook: ["facebook.com", "fb.com"],
  twitter: ["x.com", "twitter.com"],
  instagram: ["instagram.com"],
  linkedin: ["linkedin.com"],
  youtube: ["youtube.com", "youtu.be"],
};

/** Reject CMS typos (e.g. LinkedIn → x.com) and fall back to canonical URLs. */
export function sanitizeSocialRailHref(platform: SocialRailPlatform, href: string): string {
  const fallback = getDefaultSocialRailHref(platform);
  const trimmed = href.trim();
  if (!trimmed) return fallback;

  try {
    const host = new URL(trimmed).hostname.replace(/^www\./i, "").toLowerCase();
    const allowed = PLATFORM_HOST_HINTS[platform];
    const ok = allowed.some((hint) => host === hint || host.endsWith(`.${hint}`));
    return ok ? trimmed : fallback;
  } catch {
    return fallback;
  }
}

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
      href: getDefaultSocialRailHref(platform),
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

  const linkMap = new Map<SocialRailPlatform, SocialRailLink>(
    defaults.links.map((link) => [link.platform, link]),
  );

  for (const item of items) {
    const platform = normalizeSocialRailPlatform(item.customTitle);
    const href = item.customHref?.trim();
    if (!platform || !href) continue;
    linkMap.set(platform, {
      platform,
      label: SOCIAL_RAIL_PLATFORM_LABELS[platform],
      href: sanitizeSocialRailHref(platform, href),
    });
  }

  const links = [...linkMap.values()];

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
  href: getDefaultSocialRailHref(platform),
}));
