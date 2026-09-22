import { findCategoryInList, normalizeCategorySlug } from "@/lib/categorySlug";
import type { BulkImportRow } from "@/types/catalog";
import type { Category } from "@/types/category";

/** Amazon / Google browse values that are too broad for Vibe catalog assignment. */
const GENERIC_BULK_CATEGORY_VALUES = new Set([
  "musical instruments",
  "musical instrument",
  "instruments",
  "instrument",
  "general",
  "other",
  "miscellaneous",
  "uncategorized",
]);

const TITLE_CATEGORY_RULES: Array<{ pattern: RegExp; slug: string }> = [
  {
    pattern: /\b(accessory pack|accessories pack|accessory kit)\b/i,
    slug: "cables-cases-accessories",
  },
  { pattern: /\bmicrophone\b|\bmic\b|\bshotgun\b/i, slug: "microphones-wireless" },
  { pattern: /\bwireless\b.*\b(system|receiver|transmitter)\b/i, slug: "microphones-wireless" },
  {
    pattern: /\b(recorder|recording|podcast|audio interface|handheld recorder)\b/i,
    slug: "studio-recording",
  },
  {
    pattern: /\b(multi-?effects|effects processor|vocal effects|amp modeling|looper)\b/i,
    slug: "studio-recording",
  },
  { pattern: /\b(guitar|bass)\b/i, slug: "guitars" },
  { pattern: /\b(keyboard|synthesizer|piano)\b/i, slug: "keyboards-synthesizers" },
  { pattern: /\b(drum|percussion|cymbal)\b/i, slug: "drums-percussion" },
  { pattern: /\b(dj|turntable|controller)\b/i, slug: "dj-equipment" },
  { pattern: /\b(case|cable|adapter|stand|bag)\b/i, slug: "cables-cases-accessories" },
  { pattern: /\b(live sound|speaker|pa system|lighting)\b/i, slug: "live-sound-lighting" },
  { pattern: /\b(software|plug-?in|vst|daw)\b/i, slug: "software-plug-ins" },
];

export function isGenericBulkCategoryValue(value: string | undefined | null): boolean {
  if (!value?.trim()) return true;
  return GENERIC_BULK_CATEGORY_VALUES.has(value.trim().toLowerCase());
}

/** Prefer specific listing columns over generic Amazon browse categories. */
export function pickBulkImportCategoryLabel(row: BulkImportRow): string {
  const candidates = collectBulkImportCategoryCandidates(row);
  const specific = candidates.find((value) => !isGenericBulkCategoryValue(value));
  if (specific) return specific;
  return candidates[0]?.trim() ?? row.category?.trim() ?? "";
}

export function collectBulkImportCategoryCandidates(row: BulkImportRow): string[] {
  const specs = row.specifications ?? {};
  const values = [
    row.subcategory,
    specs["Product Category"],
    specs["Subcategory"],
    specs["Product Type"],
    specs["Category"],
    specs["Instrument"],
    specs["Browse Node"],
    row.category,
  ];

  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const raw of values) {
    if (!raw?.trim()) continue;
    for (const part of splitCategoryPath(raw)) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const key = normalizeCategorySlug(trimmed);
      if (seen.has(key)) continue;
      seen.add(key);
      ordered.push(trimmed);
    }
  }

  return ordered;
}

function splitCategoryPath(value: string): string[] {
  return value
    .split(/>|,|\||;/)
    .map((part) => part.trim())
    .filter(Boolean)
    .reverse();
}

export function inferBulkImportCategorySlug(productName: string): string | null {
  const title = productName.trim();
  if (!title) return null;
  for (const rule of TITLE_CATEGORY_RULES) {
    if (rule.pattern.test(title)) return rule.slug;
  }
  return null;
}

export function resolveBulkImportCategory(
  categories: Category[],
  row: BulkImportRow,
): { category: Category | null; matchedLabel: string | null; inferredFromTitle: boolean } {
  for (const label of collectBulkImportCategoryCandidates(row)) {
    if (isGenericBulkCategoryValue(label)) continue;
    const found = findCategoryInList(categories, label);
    if (found) {
      return { category: found, matchedLabel: label, inferredFromTitle: false };
    }
  }

  const inferredSlug = inferBulkImportCategorySlug(row.name ?? "");
  if (inferredSlug) {
    const found = findCategoryInList(categories, inferredSlug);
    if (found) {
      return { category: found, matchedLabel: row.name ?? null, inferredFromTitle: true };
    }
  }

  return { category: null, matchedLabel: row.category?.trim() || null, inferredFromTitle: false };
}

export function formatBulkImportCategoryHint(categories: Category[]): string {
  return categories
    .slice(0, 8)
    .map((category) => category.name)
    .join(", ");
}
