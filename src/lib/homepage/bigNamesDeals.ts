import { productPath } from "@/lib/routes";
import { isGuitarProduct } from "@/lib/product/guitarShowcaseSpecs";
import { BIG_NAMES_DEALS } from "@/data/bigNamesDeals";
import type { CatalogProduct } from "@/types/catalog";

export const BIG_NAMES_DEALS_MAX_ITEMS = 5;

export interface BigNamesDealItem {
  key: string;
  brand: string;
  href: string;
  product: string;
  productAlt: string;
}

/** Keywords used to pair showcase brand imagery with live catalog guitars. */
const SHOWCASE_MATCH_KEYWORDS: Record<string, string[]> = {
  gibson: ["sg", "explorer", "electric", "professional", "hza-uk", "uk(24)"],
  epiphone: ["sunburst", "les", "paul", "amber", "3900", "4060"],
  prs: ["natural", "green", "solid top", "4040", "3600", "studio"],
  ibanez: ["tobacco", "black", "eq", "3900eq", "electro"],
  fender: ["sunburst", "strat", "4060", "3900", "acoustic"],
};

export function isBigNamesDealsGuitarProduct(product: CatalogProduct): boolean {
  if (product.status !== "active") return false;
  if (!isGuitarProduct(product.categorySlug, product.category)) return false;
  const name = product.name.toLowerCase();
  if (name.includes("amplifier") || name.includes(" amp ")) return false;
  return true;
}

export function mapCatalogProductToBigNamesDeal(
  product: CatalogProduct,
  overrides?: { href?: string; image?: string; title?: string }
): BigNamesDealItem {
  const href =
    overrides?.href && overrides.href.startsWith("/product/")
      ? overrides.href
      : productPath(product.slug);

  return {
    key: product.id,
    brand: product.brand,
    href,
    product: overrides?.image ?? (product.image || product.images[0] || ""),
    productAlt: overrides?.title ?? product.name,
  };
}

function scoreGuitarMatch(product: CatalogProduct, keywords: string[]): number {
  const haystack = `${product.name} ${product.brand} ${product.slug}`.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword.toLowerCase())) score += 3;
  }
  if (typeof product.rating === "number") score += product.rating;
  if (product.availability === "in-stock") score += 1;
  return score;
}

function toShowcaseItem(
  deal: (typeof BIG_NAMES_DEALS)[number],
  product?: CatalogProduct
): BigNamesDealItem {
  if (product) {
    return {
      key: deal.key,
      brand: deal.brand,
      href: productPath(product.slug),
      product: deal.product,
      productAlt: `${deal.brand} showcase — shop ${product.name}`,
    };
  }

  return {
    key: deal.key,
    brand: deal.brand,
    href: productPath(deal.productSlug),
    product: deal.product,
    productAlt: deal.productAlt,
  };
}

/**
 * Keep iconic brand visuals and always deep-link to a product PDP —
 * never a category or search suggestions list.
 */
export function resolveBigNamesDealFallbacks(
  products: CatalogProduct[]
): BigNamesDealItem[] {
  const guitars = products.filter(isBigNamesDealsGuitarProduct);
  const bySlug = new Map(guitars.map((product) => [product.slug, product]));
  const used = new Set<string>();

  return BIG_NAMES_DEALS.slice(0, BIG_NAMES_DEALS_MAX_ITEMS).map((deal) => {
    const preferred = bySlug.get(deal.productSlug);
    if (preferred && !used.has(preferred.id)) {
      used.add(preferred.id);
      return toShowcaseItem(deal, preferred);
    }

    const keywords = SHOWCASE_MATCH_KEYWORDS[deal.key] ?? [deal.brand.toLowerCase()];
    const ranked = [...guitars]
      .filter((product) => !used.has(product.id))
      .sort(
        (a, b) =>
          scoreGuitarMatch(b, keywords) - scoreGuitarMatch(a, keywords) ||
          a.name.localeCompare(b.name)
      );

    const matched = ranked[0];
    if (matched) {
      used.add(matched.id);
      return toShowcaseItem(deal, matched);
    }

    // Catalog unavailable / empty — still open the configured product page.
    return toShowcaseItem(deal);
  });
}
