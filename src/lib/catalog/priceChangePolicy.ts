export const MAX_AUTO_PUBLISH_DISCOUNT_RATIO = 0.4;
export const MAX_AUTO_PUBLISH_PRICE_DELTA_RATIO = 0.2;

export type PriceChangeSnapshot = {
  sku: string;
  previousPrice: number;
  nextPrice: number;
  mrp: number;
};

export type PriceChangeGuardResult =
  { allowed: true } | { allowed: false; reason: string; requiresApproval: true };

export function evaluatePriceChangeGuard(
  input: PriceChangeSnapshot,
  options?: { allowLargeChanges?: boolean },
): PriceChangeGuardResult {
  if (options?.allowLargeChanges) {
    return { allowed: true };
  }
  const { previousPrice, nextPrice, mrp } = input;

  if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Sale price must be a positive number.",
    };
  }
  if (!Number.isFinite(mrp) || mrp <= 0) {
    return { allowed: false, requiresApproval: true, reason: "MRP must be a positive number." };
  }
  if (nextPrice > mrp) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Sale price cannot exceed MRP.",
    };
  }

  const discountRatio = mrp > 0 ? 1 - nextPrice / mrp : 0;
  if (discountRatio > MAX_AUTO_PUBLISH_DISCOUNT_RATIO) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: `Discount exceeds ${Math.round(MAX_AUTO_PUBLISH_DISCOUNT_RATIO * 100)}% — manager approval required.`,
    };
  }

  if (previousPrice > 0) {
    const deltaRatio = Math.abs(nextPrice - previousPrice) / previousPrice;
    if (deltaRatio > MAX_AUTO_PUBLISH_PRICE_DELTA_RATIO) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: `Price moved more than ${Math.round(
          MAX_AUTO_PUBLISH_PRICE_DELTA_RATIO * 100,
        )}% — manager approval required.`,
      };
    }
  }

  return { allowed: true };
}
