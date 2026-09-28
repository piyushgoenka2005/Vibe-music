import products from "@/data/catalog/products.json";

type CatalogProductRow = {
  categorySlug?: string;
  category?: string;
  brand?: string;
};

/** Brands with SKUs in a category — keeps bento tiles aligned with the live catalogue. */
export function catalogBrandsForCategory(categorySlug: string, maxBrands = 3): string | undefined {
  const unique = new Set<string>();
  for (const product of products as CatalogProductRow[]) {
    const slug = product.categorySlug ?? product.category;
    if (slug !== categorySlug) continue;
    const brand = product.brand?.trim();
    if (brand) unique.add(brand);
  }

  const sorted = [...unique].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 0) return undefined;
  return sorted.slice(0, maxBrands).join(" • ");
}
