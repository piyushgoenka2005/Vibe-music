import type { Brand } from "@/types/brand";
import type { CatalogProduct } from "@/types/catalog";

export interface BrandCatalogGroup {
  id: string;
  name: string;
  slug: string;
  letter: string;
  products: CatalogProduct[];
}

export function brandIndexLetter(name: string): string {
  const ch = name.trim().charAt(0).toUpperCase();
  return ch >= "A" && ch <= "Z" ? ch : "#";
}

function normalizeBrandSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function groupCatalogByBrand(
  catalog: CatalogProduct[],
  brands: Brand[],
): BrandCatalogGroup[] {
  const brandMeta = new Map(brands.map((brand) => [normalizeBrandSlug(brand.slug), brand]));
  const groups = new Map<string, BrandCatalogGroup>();

  function ensureGroup(slug: string, fallbackName: string): BrandCatalogGroup {
    const normalized = normalizeBrandSlug(slug);
    const existing = groups.get(normalized);
    if (existing) return existing;

    const meta = brandMeta.get(normalized);
    const name = meta?.name || fallbackName || normalized;
    const group: BrandCatalogGroup = {
      id: meta?.id ?? normalized,
      name,
      slug: meta?.slug ?? normalized,
      letter: brandIndexLetter(name),
      products: [],
    };
    groups.set(normalized, group);
    return group;
  }

  for (const brand of brands) {
    ensureGroup(brand.slug, brand.name);
  }

  for (const product of catalog) {
    if (product.status !== "active") continue;
    const slug = product.brandSlug?.trim();
    if (!slug) continue;
    ensureGroup(slug, product.brand).products.push(product);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      products: [...group.products].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
