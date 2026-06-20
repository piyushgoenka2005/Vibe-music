import { slugify } from "@/lib/slug";
import type { Category } from "@/types/category";

/** Normalize a category slug/key for lookup (lowercase, trim, hyphenate). */
export function normalizeCategorySlug(value: string): string {
  return slugify(value.trim());
}

/** Singular/plural slug variants for fuzzy matching. */
function slugVariants(slug: string): string[] {
  const normalized = normalizeCategorySlug(slug);
  if (!normalized) return [];

  const variants = new Set<string>([normalized]);
  if (
    normalized.endsWith("s") &&
    !normalized.endsWith("ss") &&
    normalized.length > 3
  ) {
    variants.add(normalized.slice(0, -1));
  } else if (!normalized.endsWith("s")) {
    variants.add(`${normalized}s`);
  }

  return Array.from(variants);
}

function variantsMatch(a: string, b: string): boolean {
  const left = slugVariants(a);
  const right = slugVariants(b);
  return left.some((value) => right.includes(value));
}

function slugSegmentMatch(requested: string, categorySlug: string): boolean {
  const norm = normalizeCategorySlug(requested);
  const cat = normalizeCategorySlug(categorySlug);
  if (!norm || !cat) return false;

  if (cat === norm || cat.startsWith(`${norm}-`) || cat.endsWith(`-${norm}`)) {
    return true;
  }

  const segments = cat.split("-");
  if (segments.includes(norm)) return true;

  const first = segments[0];
  if (first && variantsMatch(first, norm)) return true;

  return variantsMatch(cat, norm);
}

function nameMatch(requested: string, category: Category): boolean {
  const norm = normalizeCategorySlug(requested);
  const nameNorm = normalizeCategorySlug(category.name);
  if (nameNorm === norm || variantsMatch(nameNorm, norm)) return true;

  const words = category.name.toLowerCase().split(/[\s&]+/).filter(Boolean);
  return words.some((word) => {
    const wordNorm = normalizeCategorySlug(word);
    if (wordNorm === norm || variantsMatch(wordNorm, norm)) return true;
    const stem = norm.endsWith("s") ? norm.slice(0, -1) : norm;
    return stem.length >= 3 && wordNorm.startsWith(stem);
  });
}

/** Resolve a category from a list using normalized slug, aliases, and plural forms. */
export function findCategoryInList(
  categories: Category[],
  requestedSlug: string
): Category | undefined {
  if (!requestedSlug.trim() || categories.length === 0) return undefined;

  const normalized = normalizeCategorySlug(requestedSlug);

  const exact = categories.find(
    (category) => normalizeCategorySlug(category.slug) === normalized
  );
  if (exact) return exact;

  const plural = categories.find((category) =>
    variantsMatch(category.slug, normalized)
  );
  if (plural) return plural;

  const segment = categories.find((category) =>
    slugSegmentMatch(normalized, category.slug)
  );
  if (segment) return segment;

  return categories.find((category) => nameMatch(normalized, category));
}
