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

export function groupCatalogByBrand(
  catalog: CatalogProduct[],
  brands: Brand[],
): BrandCatalogGroup[] {
  const brandMeta = new Map(brands.map((brand) => [brand.slug, brand]));
  const groups = new Map<string, BrandCatalogGroup>();

  function ensureGroup(slug: string, fallbackName: string): BrandCatalogGroup {
    const existing = groups.get(slug);
    if (existing) return existing;

    const meta = brandMeta.get(slug);
    const name = meta?.name || fallbackName || slug;
    const group: BrandCatalogGroup = {
      id: meta?.id ?? slug,
      name,
      slug,
      letter: brandIndexLetter(name),
      products: [],
    };
    groups.set(slug, group);
    return group;
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
