import { BRAND } from "@/lib/brand";

export const SITE_NAME = BRAND.name;
export const SITE_DESCRIPTION = BRAND.description;
export const SITE_URL = BRAND.siteUrl;
export const SITE_EMAIL = BRAND.email;

export const DEFAULT_METADATA = {
  title: `${BRAND.name}: Musical Instruments, Pro Audio, Accessories & More`,
  description: BRAND.description,
  metadataBase: new URL(BRAND.siteUrl),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/Favicon.png", type: "image/png", sizes: "1024x1024" },
      { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
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
    // Per-page routes set their own canonical; avoid forcing "/" globally.
  },
};
