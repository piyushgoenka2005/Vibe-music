import { categoryPath, ROUTES } from "@/lib/routes";

export const SEARCH_LANDING_ROLLING_TERMS = [
  "electric guitars",
  "studio mics",
  "drum kits",
  "synthesizers",
  "audio interfaces",
  "DJ controllers",
  "pedals",
] as const;

export const SEARCH_LANDING_QUICK_CHIPS = [
  { label: "Guitars", href: categoryPath("guitars") },
  { label: "Drums", href: categoryPath("drums-percussion") },
  { label: "Studio", href: categoryPath("studio-recording") },
  { label: "Live sound", href: categoryPath("live-sound-lighting") },
  { label: "Deals", href: ROUTES.deals },
  { label: "New arrivals", href: `${ROUTES.searchResults}?q=new` },
] as const;

export const SEARCH_LANDING_TRENDING = [
  "SM58",
  "Scarlett",
  "Stratocaster",
  "electronic drums",
  "monitor speakers",
] as const;
