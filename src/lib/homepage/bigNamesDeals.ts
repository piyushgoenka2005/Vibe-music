import { BIG_NAMES_DEALS } from "@/data/bigNamesDeals";
import { getProductImage, isGenericProductPlaceholder } from "@/data/productImages";
import { isCdnUrl } from "@/lib/cdnConfig";
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

function localProductImage(product: CatalogProduct): string {
  const local = getProductImage(product.slug, product.category);
  return local.startsWith("/images/") ? local : "";
}

export function resolveBigNamesDealSlot(options: {
  dealKey?: string;
  productSlug?: string;
  slotIndex?: number;
}): (typeof BIG_NAMES_DEALS)[number] | undefined {
  return (
    BIG_NAMES_DEALS.find((entry) => entry.key === options.dealKey) ??
    BIG_NAMES_DEALS.find((entry) => entry.productSlug === options.productSlug) ??
    (options.slotIndex != null ? BIG_NAMES_DEALS[options.slotIndex] : undefined)
  );
}

/** Curated slot art for index — stable even when admin picks a different catalog SKU. */
export function bigNamesShowcaseArtForSlot(slotIndex: number): string {
  return (
    BIG_NAMES_DEALS[slotIndex]?.product ??
    BIG_NAMES_DEALS[slotIndex % BIG_NAMES_DEALS.length]?.product ??
    "/images/New Guitar.png"
  );
}

/** Showcase art must render offline — prefer curated slot art over catalog thumbnails. */
export function resolveBigNamesShowcaseImage(
  customImage: string | undefined,
  deal: (typeof BIG_NAMES_DEALS)[number],
  product?: CatalogProduct,
): string {
  const staticArt = deal.product;
  const trimmed = customImage?.trim() ?? "";

  if (!trimmed) return staticArt;
  if (trimmed.startsWith("/images/")) {
    if (isGenericProductPlaceholder(trimmed)) return staticArt;
    const generic = product ? localProductImage(product) : "";
    if (generic && trimmed === generic) return staticArt;
    return trimmed;
  }
  if (isCdnUrl(trimmed)) {
    return staticArt || (product ? localProductImage(product) : "") || "/images/New Guitar.png";
  }
  return trimmed;
}

export function mapCatalogProductToBigNamesDeal(
  product: CatalogProduct,
  overrides?: {
    href?: string;
    title?: string;
    dealKey?: string;
    slotIndex?: number;
  },
): BigNamesDealItem {
  const href =
    overrides?.href && overrides.href.startsWith("/product/")
      ? overrides.href
      : productPath(product.slug);

  const deal = resolveBigNamesDealSlot({
    dealKey: overrides?.dealKey,
    productSlug: product.slug,
    slotIndex: overrides?.slotIndex,
  });

  const productSrc =
    deal?.product ??
    (overrides?.slotIndex != null
      ? bigNamesShowcaseArtForSlot(overrides.slotIndex)
      : localProductImage(product) || "/images/New Guitar.png");

  return {
    key: deal?.key ?? product.id,
    brand: product.brand,
    href,
    product: productSrc,
    productAlt: overrides?.title ?? product.name,
  };
}

function toShowcaseItem(
  deal: (typeof BIG_NAMES_DEALS)[number],
  product?: CatalogProduct,
): BigNamesDealItem {
  if (product) {
    return {
      key: deal.key,
      // Always use the live catalog brand — never a mismatched showcase label.
      brand: product.brand,
      href: productPath(product.slug),
      product: deal.product,
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
export function resolveBigNamesDealFallbacks(products: CatalogProduct[]): BigNamesDealItem[] {
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
