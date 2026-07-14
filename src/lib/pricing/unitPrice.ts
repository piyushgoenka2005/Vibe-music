/** Resolve a chargeable unit price, treating non-positive values as missing. */
export function resolvePositiveUnitPrice(
  productPrice: number | null | undefined,
  variantPrice?: number | null
): number | null {
  if (typeof variantPrice === "number" && Number.isFinite(variantPrice) && variantPrice > 0) {
    return variantPrice;
  }
  if (typeof productPrice === "number" && Number.isFinite(productPrice) && productPrice > 0) {
    return productPrice;
  }
  return null;
}
