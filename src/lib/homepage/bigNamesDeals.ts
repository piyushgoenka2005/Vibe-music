import { BIG_NAMES_DEALS } from "@/data/bigNamesDeals";
import { isCdnUrl } from "@/lib/cdnConfig";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { productPath } from "@/lib/routes";
import { isGuitarProduct } from "@/lib/product/guitarShowcaseSpecs";
import { isNonInstrumentGuitarProduct } from "@/lib/product/productRelevance";
import {
  isFlatPackshotImageUrl,
  pickBigNamesShowcaseImage,
  resolveProductCardImage,
  resolveProductGalleryUrls,
} from "@/lib/product/resolveProductCardImage";
import type { CatalogProduct } from "@/types/catalog";

export const BIG_NAMES_DEALS_MAX_ITEMS = 5;

export interface BigNamesDealItem {
  key: string;
  brand: string;
  href: string;
  logo: string;
  product: string;
  productFallback?: string;
  productAlt: string;
  blendMultiply?: boolean;
}

export function isBigNamesDealsGuitarProduct(product: CatalogProduct): boolean {
  if (product.status !== "active") return false;
  if (!isGuitarProduct(product.categorySlug, product.category)) return false;
  if (isNonInstrumentGuitarProduct(product)) return false;
  return true;
}

function usesShowcaseBlend(src: string): boolean {
  return src.startsWith("/images/big-names-deals/");
}

function resolveBigNamesProductImage(
  product: CatalogProduct,
  customImage?: string,
): { src: string; fallbackSrc: string; blendMultiply: boolean } {
  const input = {
    slug: product.slug,
    category: product.category,
    image: customImage?.trim() || product.image,
    images: product.images,
  };
  const resolved = resolveProductCardImage(input);
  const gallery = resolveProductGalleryUrls(input);
  let showcaseSrc =
    pickBigNamesShowcaseImage(gallery) || resolved.src || gallery[0] || resolved.src;
  // Gallery may omit CDN art when the upload folder slug differs from the product slug.
  if (!isCdnUrl(showcaseSrc) && isCdnUrl(resolved.src)) {
    showcaseSrc = pickBigNamesShowcaseImage([resolved.src, ...gallery]) || resolved.src;
  }
  const blendMultiply = isFlatPackshotImageUrl(showcaseSrc) || usesShowcaseBlend(showcaseSrc);

  return {
    src: showcaseSrc,
    fallbackSrc: resolved.fallbackSrc,
    blendMultiply,
  };
}

function catalogProductToBigNamesDealItem(
  product: CatalogProduct,
  overrides?: {
    href?: string;
    title?: string;
    customImage?: string;
    key?: string;
  },
): BigNamesDealItem {
  const href =
    overrides?.href && overrides.href.startsWith("/product/")
      ? overrides.href
      : productPath(product.slug);
  const { src, fallbackSrc, blendMultiply } = resolveBigNamesProductImage(
    product,
    overrides?.customImage,
  );

  return {
    key: overrides?.key ?? product.id,
    brand: product.brand,
    href,
    logo: getBrandLogoUrl(product.brandSlug) ?? "",
    product: src,
    productFallback: fallbackSrc !== src ? fallbackSrc : undefined,
    productAlt: overrides?.title ?? product.name,
    blendMultiply,
  };
}

function staticDealToBigNamesDealItem(deal: (typeof BIG_NAMES_DEALS)[number]): BigNamesDealItem {
  return {
    key: deal.key,
    brand: deal.brand,
    href: productPath(deal.productSlug),
    logo: deal.logo,
    product: deal.product,
    productAlt: deal.productAlt,
    blendMultiply: deal.blendMultiply,
  };
}

export function mapCatalogProductToBigNamesDeal(
  product: CatalogProduct,
  overrides?: {
    href?: string;
    title?: string;
    customImage?: string;
    dealKey?: string;
    slotIndex?: number;
  },
): BigNamesDealItem {
  const deal = overrides?.dealKey
    ? BIG_NAMES_DEALS.find((entry) => entry.key === overrides.dealKey)
    : BIG_NAMES_DEALS.find((entry) => entry.productSlug === product.slug);

  return catalogProductToBigNamesDealItem(product, {
    href: overrides?.href,
    title: overrides?.title,
    customImage: overrides?.customImage,
    key: deal?.key ?? product.id,
  });
}

/**
 * Featured guitars deep-link to real PDPs. Brand text always matches the
 * catalog product — never Gibson/Fender labels on Hertz SKUs.
 */
export function isRenderableBigNamesDealItem(item: BigNamesDealItem): boolean {
  if (!item.href.startsWith("/product/")) return false;
  if (item.brand.trim().startsWith("/")) return false;
  if (!item.product.trim()) return false;
  return true;
}

export function resolveBigNamesDealFallbacks(products: CatalogProduct[]): BigNamesDealItem[] {
  const guitars = products.filter(isBigNamesDealsGuitarProduct);
  const bySlug = new Map(guitars.map((product) => [product.slug, product]));
  const used = new Set<string>();

  const items: BigNamesDealItem[] = [];

  for (const deal of BIG_NAMES_DEALS.slice(0, BIG_NAMES_DEALS_MAX_ITEMS)) {
    const preferred = bySlug.get(deal.productSlug);
    if (preferred && !used.has(preferred.id)) {
      used.add(preferred.id);
      items.push(catalogProductToBigNamesDealItem(preferred, { key: deal.key }));
      continue;
    }

    const next = guitars.find((product) => !used.has(product.id));
    if (next) {
      used.add(next.id);
      items.push(catalogProductToBigNamesDealItem(next, { key: deal.key }));
      continue;
    }

    items.push(staticDealToBigNamesDealItem(deal));
  }

  return items;
}
