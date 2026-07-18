/** Every storefront product must show at least this many ratings. */
export const MIN_PRODUCT_REVIEW_COUNT = 264;

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable 4.0–4.9 rating when catalog rating is missing/too low. */
export function fallbackProductRating(productId: string): number {
  const ratings = [4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9];
  return ratings[hashString(`${productId}:rating`) % ratings.length]!;
}

/**
 * Ensure rating + review count meet the storefront minimum (>263 reviews).
 * Uses existing metrics when already above the floor.
 */
export function ensureProductReviewMetrics(input: {
  id: string;
  rating?: number | null;
  reviewCount?: number | null;
}): { rating: number; reviewCount: number } {
  const rawCount = Math.max(0, Math.floor(Number(input.reviewCount) || 0));
  const reviewCount = Math.max(MIN_PRODUCT_REVIEW_COUNT, rawCount || MIN_PRODUCT_REVIEW_COUNT);

  const rawRating = Number(input.rating);
  const rating =
    Number.isFinite(rawRating) && rawRating >= 3.5
      ? Math.round(rawRating * 10) / 10
      : fallbackProductRating(input.id);

  return { rating, reviewCount };
}

export function formatRatingPillLabel(rating: number, _reviewCount?: number): string {
  return rating.toFixed(1);
}
