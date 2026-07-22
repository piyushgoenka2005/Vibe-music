import { productPath } from "@/lib/routes";
import { isGuitarProduct } from "@/lib/product/guitarShowcaseSpecs";
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
  return (
    product.status === "active" &&
    isGuitarProduct(product.categorySlug, product.category)
  );
}

export function mapCatalogProductToBigNamesDeal(
  product: CatalogProduct,
  overrides?: { href?: string; image?: string; title?: string }
): BigNamesDealItem {
  return {
    key: product.id,
    brand: product.brand,
    href: overrides?.href ?? productPath(product.slug),
    product: overrides?.image ?? (product.image || product.images[0] || ""),
    productAlt: overrides?.title ?? product.name,
  };
}
