export const BRAND = {
  name: "Vibe Music",
  shortName: "VibeMusic",
  tagline: "Your Sound, Delivered",
  description:
    "Vibe Music is India's trusted destination for musical instruments, pro audio, accessories, and expert gear advice.",
  supportRole: "Gear Advisor",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE ?? "",
  phoneDisplay: process.env.NEXT_PUBLIC_STORE_PHONE ?? "",
  phoneTel: process.env.NEXT_PUBLIC_STORE_PHONE
    ? `+${process.env.NEXT_PUBLIC_STORE_PHONE.replace(/\D/g, "")}`
    : "",
  email: "support@vibemusic.in",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibemusic.in",
  domain: "vibemusic.in",
  address: "Mumbai, Maharashtra, India",
  logoPath: "/brand/vibemusic-logo.svg",
  headerLogoPath: "/images/FINAL LOGO VIBE MUSIC GUITAR 2.png",
  iconPath: "/icon-48.png",
  cardName: "Vibe Music Card",
  financingName: "Vibe Music Financing",
  gearExchangeName: "Vibe Music Gear Exchange",
  studiosName: "Vibe Music Studios",
} as const;
