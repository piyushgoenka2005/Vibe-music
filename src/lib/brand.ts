import { CANONICAL_BUSINESS_ADDRESS } from "@/lib/brand/businessIdentity";

/** Canonical storefront support number (10-digit Indian mobile). */
export const DEFAULT_STORE_PHONE = "8910482950";

/** Human-readable storefront support number shown in UI, invoices, and footer. */
export const DEFAULT_STORE_PHONE_DISPLAY = "+91 891 048 2950";

export const SUPPORT_WHATSAPP_MESSAGE =
  "Hi Vibe Music, I need help with my order or have a product question.";

function storePhoneFromEnv(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_PHONE?.trim() ||
    process.env.STORE_PHONE?.trim() ||
    DEFAULT_STORE_PHONE
  );
}

export function formatIndianPhone(raw: string | undefined): {
  display: string;
  tel: string;
  whatsappDigits: string;
} {
  if (!raw) return { display: "", tel: "", whatsappDigits: "" };
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { display: "", tel: "", whatsappDigits: "" };

  const normalized =
    digits.length === 10 ? `91${digits}` : digits.startsWith("91") ? digits : digits;
  const local = normalized.startsWith("91") ? normalized.slice(2) : normalized;
  const display =
    local.length === 10
      ? `+91 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
      : `+${normalized}`;

  return { display, tel: `+${normalized}`, whatsappDigits: normalized };
}

export function buildWhatsAppUrl(phoneTelOrDigits: string, message?: string): string {
  const digits = phoneTelOrDigits.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  const base = `https://wa.me/${normalized}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Mobile-friendly deep link (opens WhatsApp app when installed). */
export function buildWhatsAppApiUrl(phoneDigits: string, message?: string): string {
  const digits = phoneDigits.replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  const params = new URLSearchParams({
    phone: normalized,
    type: "phone_number",
    app_absent: "0",
  });
  if (message) params.set("text", message);
  return `https://api.whatsapp.com/send/?${params.toString()}`;
}

const storePhone = storePhoneFromEnv();
const formattedPhone = formatIndianPhone(storePhone);
const whatsappUrl = buildWhatsAppUrl(formattedPhone.whatsappDigits, SUPPORT_WHATSAPP_MESSAGE);
const whatsappMobileUrl = buildWhatsAppApiUrl(
  formattedPhone.whatsappDigits,
  SUPPORT_WHATSAPP_MESSAGE,
);

export const BRAND = {
  name: "Vibe Music",
  legalName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || "Vibe Music",
  gstin: process.env.NEXT_PUBLIC_GSTIN?.trim() || "",
  shortName: "VibeMusic",
  tagline: "Your Sound, Delivered",
  description:
    "Vibe Music is India's trusted destination for musical instruments, pro audio, accessories, and expert gear advice.",
  supportRole: "Gear Advisor",
  phone: storePhone,
  phoneDisplay: formattedPhone.display || storePhone,
  phoneTel: formattedPhone.tel,
  whatsappUrl,
  whatsappMobileUrl,
  whatsappDigits: formattedPhone.whatsappDigits,
  email: "support@vibemusic.in",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibemusic.in",
  domain: "vibemusic.in",
  address: CANONICAL_BUSINESS_ADDRESS,
  logoPath: "/brand/vibemusic-logo.svg",
  headerLogoPath: "/brand/header-logo.webp",
  iconPath: "/icon-48.png",
  cardName: "Vibe Music Card",
  /** Reserved brand name — no Gear Exchange storefront yet. */
  gearExchangeName: "Vibe Music Gear Exchange",
  /** Reserved brand name — no Studios booking surface yet. */
  studiosName: "Vibe Music Studios",
} as const;
