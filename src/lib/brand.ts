function storePhoneFromEnv(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_PHONE?.trim() ||
    process.env.STORE_PHONE?.trim() ||
    ""
  );
}

const storePhone = storePhoneFromEnv();

export const BRAND = {
  name: "Vibe Music",
  shortName: "VibeMusic",
  tagline: "Your Sound, Delivered",
  description:
    "Vibe Music is India's trusted destination for musical instruments, pro audio, accessories, and expert gear advice.",
  supportRole: "Gear Advisor",
  phone: storePhone,
  phoneDisplay: storePhone,
  phoneTel: storePhone
    ? `+${storePhone.replace(/\D/g, "")}`
    : "",
  email: "support@vibemusic.in",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibemusic.in",
  domain: "vibemusic.in",
  address: "Mumbai, Maharashtra, India",
  logoPath: "/brand/vibemusic-logo.svg",
  headerLogoPath: "/brand/header-logo.webp",
  iconPath: "/icon-48.png",
  cardName: "Vibe Music Card",
  /** Display name only — no in-house financing product is live (see /financing). */
  financingName: "Vibe Music Financing",
  /** Reserved brand name — no Gear Exchange storefront yet. */
  gearExchangeName: "Vibe Music Gear Exchange",
  /** Reserved brand name — no Studios booking surface yet. */
  studiosName: "Vibe Music Studios",
} as const;
