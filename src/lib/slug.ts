export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Build a catalog slug from brand + product name without repeating the brand
 * token when the name already starts with it (e.g. hertz-hertz-hz → hertz-hz).
 */
export function buildProductSlug(brand: string, name: string): string {
  const brandSlug = slugify(brand);
  const trimmedName = name.trim();
  if (!trimmedName) return brandSlug;
  if (!brandSlug) return slugify(trimmedName);

  let slug = slugify(`${brand}-${trimmedName}`);
  const duplicatePrefix = `${brandSlug}-${brandSlug}`;
  while (slug === duplicatePrefix || slug.startsWith(`${duplicatePrefix}-`)) {
    slug = slug.slice(brandSlug.length + 1);
  }
  return slug;
}

export function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeProductSlug(value: string): string {
  return slugify(decodeURIComponent(value).trim());
}
