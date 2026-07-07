import type { CatalogProduct } from "@/types/catalog";
import type { HomepageProductItem } from "@/types/homepage";

/** Whether a catalog row has a real storefront price (not "price on request"). */
export function hasPositiveDisplayPrice(product: CatalogProduct): boolean {
  const salePrice = product.detail?.salePrice;
  if (salePrice != null && salePrice > 0) return true;
  return product.price > 0;
}

/** Homepage carousels/grids show active catalog items even when price is on request. */
export function isHomepageProductVisible(item: HomepageProductItem): boolean {
  return Boolean(item.id && item.name);
}
