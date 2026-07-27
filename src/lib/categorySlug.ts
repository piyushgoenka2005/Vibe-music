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

  const byId = categories.find(
    (category) => normalizeCategorySlug(category.id) === normalized
  );
  if (byId) return byId;

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

/** Alias for findCategoryInList — resolves any slug variant to a canonical category. */
export function resolveCategory(
  categories: Category[],
  requestedSlug: string
): Category | undefined {
  return findCategoryInList(categories, requestedSlug);
}

export function isCanonicalCategorySlug(
  category: Category,
  requestedSlug: string
): boolean {
  return (
    normalizeCategorySlug(category.slug) === normalizeCategorySlug(requestedSlug)
  );
}

/** Normalize a category record read from PostgreSQL or local JSON. */
export function normalizeCategoryRecord(category: Category): Category {
  const slug = normalizeCategorySlug(category.slug || category.name);
  return slug ? { ...category, slug } : category;
}

function collectAliasCandidates(category: Category): string[] {
  const canonical = normalizeCategorySlug(category.slug);
  if (!canonical) return [];

  const aliases = new Set<string>([canonical]);

  for (const variant of slugVariants(canonical)) {
    aliases.add(variant);
  }

  const segments = canonical.split("-");
  if (segments.length > 1 && segments[0]) {
    aliases.add(segments[0]);
    for (const variant of slugVariants(segments[0])) {
      aliases.add(variant);
    }
  }

  const nameNorm = normalizeCategorySlug(category.name);
  if (nameNorm) aliases.add(nameNorm);

  for (const word of category.name.toLowerCase().split(/[\s&]+/).filter(Boolean)) {
    const wordNorm = normalizeCategorySlug(word);
    if (wordNorm.length < 3) continue;
    aliases.add(wordNorm);
    for (const variant of slugVariants(wordNorm)) {
      aliases.add(variant);
    }
    if (wordNorm.length >= 5) {
      for (let len = 3; len < wordNorm.length; len += 1) {
        const stem = wordNorm.slice(0, len);
        aliases.add(stem);
        aliases.add(`${stem}s`);
      }
    }
  }

  return Array.from(aliases);
}

/** Slugs to pre-render for /category/[slug], including common aliases. */
export function collectCategoryRouteSlugs(categories: Category[]): string[] {
  const slugs = new Set<string>();

  for (const category of categories) {
    for (const alias of collectAliasCandidates(category)) {
      if (findCategoryInList(categories, alias)?.slug === category.slug) {
        slugs.add(alias);
      }
    }
  }

  return Array.from(slugs);
}
