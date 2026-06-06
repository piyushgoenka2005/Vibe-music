import { BRAND } from "@/lib/brand";

export const COLORS = {
  grey0: "#f2f1f0",
  grey10: "#e5e4e3",
  grey20: "#d1d0cf",
  grey50: "#969695",
  grey60: "#807f7e",
  grey100: "#2e2e2d",
  blue: "#0072ba",
  blue60: "#05629c",
  blue70: "#095482",
  red: "#d71920",
  green: "#3b7d1a",
  blackBarBg: "#f2f2f2",
  blackBarText: "#2e2d2b",
  heroDark: "#080708",
  footerDark: "#2e2e2d",
} as const;

export const PHONE = BRAND.phoneDisplay;

export const BLACK_BAR_LOGOS = [
  { label: BRAND.name, href: "/", active: true },
  { label: "Deals", href: "/search/results?q=deals" },
];

export const BLACK_BAR_LINKS = ["Support", "Financing", "Blog"];

export const NAV_ITEMS = [
  "Shop By Category",
  "What's New",
  "Deals",
  "Used Gear",
  "Rentals",
  "Articles & Videos",
  "Product Support",
  "Giveaway",
  BRAND.cardName,
];

export const POPULAR_CATEGORIES = [
  "Guitars",
  "Studio & Recording",
  "Drums & Percussion",
  "Bass",
  "Keyboards & Synthesizers",
  "Live Sound & Lighting",
  "Software & Plug-ins",
  "DJ Equipment",
  "Microphones & Wireless",
  "Band & Orchestra",
  "Home Audio & Electronics",
  "Commercial Audio & Installation",
  "Cables, Cases & Accessories",
  "Video & Cameras",
];
