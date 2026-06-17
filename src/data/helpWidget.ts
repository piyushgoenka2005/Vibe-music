import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";

export const HELP_WIDGET_LINKS = [
  { label: "Track your order", href: ROUTES.trackOrder },
  { label: "Returns", href: `${ROUTES.searchResults}?q=returns` },
  { label: "Shipping Policy", href: `${ROUTES.searchResults}?q=shipping` },
  { label: `${BRAND.name} Rewards`, href: `${ROUTES.searchResults}?q=rewards` },
  {
    label: "Fraudulent Websites Warning",
    href: `${ROUTES.searchResults}?q=fraud`,
  },
] as const;

export const HELP_WIDGET_HOURS = [
  "MON - FRI  10AM - 7PM IST",
  "SAT  10AM - 6PM IST",
  "SUN  11AM - 5PM IST",
] as const;

export const HELP_WIDGET_INTRO =
  "Hey, friend. Got a question? Need advice? We're here to help you out.";

export const HELP_WIDGET_DISCLAIMER =
  "Chat sessions may be recorded by Vibe Music for training, quality, and improvement purposes.";
