import type { CatalogProduct } from "@/types/catalog";
import type { HomepageProductItem } from "@/types/homepage";

export function hasPositiveDisplayPrice(product: CatalogProduct): boolean {
  const salePrice = product.detail?.salePrice;
  if (salePrice != null && salePrice > 0) return true;
  return product.price > 0;
}

export function isHomepageProductVisible(item: HomepageProductItem): boolean {
  const displayPrice = item.salePrice ?? item.price;
  return displayPrice > 0;
}
