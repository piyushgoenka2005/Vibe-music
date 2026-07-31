import { BIG_NAMES_DEALS } from "@/data/bigNamesDeals";
import { productPath } from "@/lib/routes";
import { isGuitarProduct } from "@/lib/product/guitarShowcaseSpecs";
import { isNonInstrumentGuitarProduct } from "@/lib/product/productRelevance";
import type { CatalogProduct } from "@/types/catalog";

export const BIG_NAMES_DEALS_MAX_ITEMS = 5;

export interface BigNamesDealItem {
  key: string;
  brand: string;
  href: string;
  product: string;
  productAlt: string;
}

export function isBigNamesDealsGuitarProduct(product: CatalogProduct): boolean {
  if (product.status !== "active") return false;
  if (!isGuitarProduct(product.categorySlug, product.category)) return false;
  if (isNonInstrumentGuitarProduct(product)) return false;
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

function toShowcaseItem(
  deal: (typeof BIG_NAMES_DEALS)[number],
  product?: CatalogProduct
): BigNamesDealItem {
  if (product) {
    return {
      key: deal.key,
      // Always use the live catalog brand — never a mismatched showcase label.
      brand: product.brand,
      href: productPath(product.slug),
      product: product.image || product.images[0] || deal.product,
      productAlt: product.name,
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
 * Featured guitars deep-link to real PDPs. Brand text always matches the
 * catalog product — never Gibson/Fender labels on Hertz SKUs.
 */
export function resolveBigNamesDealFallbacks(
  products: CatalogProduct[]
): BigNamesDealItem[] {
  const guitars = products.filter(isBigNamesDealsGuitarProduct);
  const bySlug = new Map(guitars.map((product) => [product.slug, product]));
  const used = new Set<string>();

  const items: BigNamesDealItem[] = [];

  for (const deal of BIG_NAMES_DEALS.slice(0, BIG_NAMES_DEALS_MAX_ITEMS)) {
    const preferred = bySlug.get(deal.productSlug);
    if (preferred && !used.has(preferred.id)) {
      used.add(preferred.id);
      items.push(toShowcaseItem(deal, preferred));
      continue;
    }

    const next = guitars.find((product) => !used.has(product.id));
    if (next) {
      used.add(next.id);
      items.push(toShowcaseItem(deal, next));
      continue;
    }

    items.push(toShowcaseItem(deal));
  }

  return items;
}
