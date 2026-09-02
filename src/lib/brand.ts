function storePhoneFromEnv(): string {
  return process.env.NEXT_PUBLIC_STORE_PHONE?.trim() || process.env.STORE_PHONE?.trim() || "";
}

const storePhone = storePhoneFromEnv();

export function formatIndianPhone(raw: string | undefined): {
  display: string;
  tel: string;
} {
  if (!raw) return { display: "", tel: "" };
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { display: "", tel: "" };

  const normalized =
    digits.length === 10 ? `91${digits}` : digits.startsWith("91") ? digits : digits;
  const local = normalized.startsWith("91") ? normalized.slice(2) : normalized;
  const display =
    local.length === 10 ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : `+${normalized}`;

  return { display, tel: `+${normalized}` };
}

const formattedPhone = formatIndianPhone(storePhone);

export const BRAND = {
  name: "Vibe Music",
  shortName: "VibeMusic",
  tagline: "Your Sound, Delivered",
  description:
    "Vibe Music is India's trusted destination for musical instruments, pro audio, accessories, and expert gear advice.",
  supportRole: "Gear Advisor",
  phone: storePhone,
  phoneDisplay: formattedPhone.display || storePhone,
  phoneTel: formattedPhone.tel,
  email: "support@vibemusic.in",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibemusic.in",
  domain: "vibemusic.in",
  address: "Sikkim Commerce House, 4/1 Middleton Street, 3rd Floor, Room 303, Kolkata – 700071",
  logoPath: "/brand/vibemusic-logo.svg",
  headerLogoPath: "/brand/header-logo.webp",
  iconPath: "/icon-48.png",
  cardName: "Vibe Music Card",
  /** Reserved brand name — no Gear Exchange storefront yet. */
  gearExchangeName: "Vibe Music Gear Exchange",
  /** Reserved brand name — no Studios booking surface yet. */
  studiosName: "Vibe Music Studios",
} as const;
