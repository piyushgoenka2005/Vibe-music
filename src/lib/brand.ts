const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibemusic-official.vercel.app";

const phoneDisplay =
  process.env.NEXT_PUBLIC_BRAND_PHONE ?? "+91 98765 43210";

const phoneTel = phoneDisplay.replace(/[^\d+]/g, "");

export const BRAND = {
  name: "VibeMusic",
  tagline: "Your Sound, Delivered",
  supportRole: "Gear Advisor",
  phone: phoneTel,
  phoneDisplay,
  email: process.env.NEXT_PUBLIC_BRAND_EMAIL ?? "support@vibemusic.com",
  domain: siteUrl.replace(/\/+$/, ""),
  cardName: "VibeMusic Card",
  logoPath: "/brand/vibemusic-logo.svg",
  iconPath: "/brand/vibemusic-icon.svg",
} as const;

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/vibemusic",
  youtube: "https://www.youtube.com/@vibemusic",
  instagram: "https://www.instagram.com/vibemusic",
  x: "https://x.com/vibemusic",
  tiktok: "https://www.tiktok.com/@vibemusic",
} as const;
