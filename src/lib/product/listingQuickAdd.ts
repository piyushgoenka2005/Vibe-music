import type { Product } from "@/types/product";
import { isPurchasablePrice } from "@/utils/currency";

export function canListingQuickAdd(
  product: Pick<Product, "availability" | "price">
): boolean {
  return (
    product.availability !== "out-of-stock" && isPurchasablePrice(product.price)
  );
}

export function shouldNavigateForVariants(
  product: Pick<Product, "requiresVariantSelection">
): boolean {
  return Boolean(product.requiresVariantSelection);
}

export function listingQuickAddLabel(
  product: Pick<Product, "requiresVariantSelection" | "availability" | "price">
): string {
  if (!canListingQuickAdd(product)) return "Out of stock";
  if (shouldNavigateForVariants(product)) return "Choose options";
  return "Add to cart";
}

export function listingQuickAddAriaLabel(
  product: Pick<Product, "requiresVariantSelection" | "name">
): string {
  if (shouldNavigateForVariants(product)) {
    return `Choose options for ${product.name}`;
  }
  return `Add ${product.name} to cart`;
}
