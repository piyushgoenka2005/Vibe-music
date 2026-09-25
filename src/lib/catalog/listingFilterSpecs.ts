import { slugify } from "@/lib/slug";

/** Specification keys surfaced as sidebar facets on category/search listings. */
export const LISTING_SPEC_KEYS = [
  "Product Type",
  "Instrument",
  "Connectivity",
  "Color",
  "Keys",
  "Channels",
  "Power",
  "Configuration",
] as const;

export type ListingSpecKey = (typeof LISTING_SPEC_KEYS)[number];

export function extractListingFilterSpecs(
  specifications: Record<string, string> | undefined,
): Record<string, string> {
  if (!specifications) return {};
  const out: Record<string, string> = {};
  for (const key of LISTING_SPEC_KEYS) {
    const value = specifications[key]?.trim();
    if (value) out[key] = value;
  }
  return out;
}

export function specKeySlug(label: string): string {
  return slugify(label);
}

export function specValueSlug(value: string): string {
  return slugify(value);
}

export function serializeSpecSelection(specs: Record<string, string[]>): string | null {
  const parts: string[] = [];
  for (const [label, values] of Object.entries(specs)) {
    if (!values.length) continue;
    const keySlug = specKeySlug(label);
    const valuePart = values.map((value) => specValueSlug(value)).join("|");
    parts.push(`${keySlug}~${valuePart}`);
  }
  return parts.length ? parts.join(",") : null;
}

export function parseSpecSelection(raw: string | null): Record<string, string[]> {
  if (!raw?.trim()) return {};
  const out: Record<string, string[]> = {};
  for (const segment of raw.split(",")) {
    const [keySlug, valuesRaw] = segment.split("~");
    if (!keySlug || !valuesRaw) continue;
    const label =
      LISTING_SPEC_KEYS.find((key) => specKeySlug(key) === keySlug) ?? keySlug.replace(/-/g, " ");
    const values = valuesRaw
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
    if (values.length) out[label] = values;
  }
  return out;
}
