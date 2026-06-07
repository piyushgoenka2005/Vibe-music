import { BRAND } from "@/lib/brand";

export const SITE_NAME = BRAND.name;
export const SITE_DESCRIPTION = BRAND.description;
export const SITE_URL = BRAND.siteUrl;
export const SITE_EMAIL = BRAND.email;

export const DEFAULT_METADATA = {
  title: `${BRAND.name}: Musical Instruments, Pro Audio, Accessories & More`,
  description: BRAND.description,
  metadataBase: new URL(BRAND.siteUrl),
  openGraph: {
    title: `${BRAND.name}: Musical Instruments, Pro Audio, Accessories & More`,
    description: BRAND.description,
    url: BRAND.siteUrl,
    siteName: BRAND.name,
    locale: "en_IN",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: `${BRAND.name}: Musical Instruments, Pro Audio, Accessories & More`,
    description: BRAND.description,
  },
  alternates: {
    canonical: "/",
  },
};
