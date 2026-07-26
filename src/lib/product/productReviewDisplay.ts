/**
 * Authentic storefront review metrics — never invent ratings or counts.
 * Cards/PDP hide the rating UI when reviewCount is 0.
 */

export function fallbackProductRating(_productId: string): number {
  return 0;
}

/**
 * Normalize catalog / live review metrics for display.
 * Passes through real values; zeros stay zero (no synthetic floor).
 */
export function ensureProductReviewMetrics(input: {
  id: string;
  rating?: number | null;
  reviewCount?: number | null;
}): { rating: number; reviewCount: number } {
  const reviewCount = Math.max(0, Math.floor(Number(input.reviewCount) || 0));
  const rawRating = Number(input.rating);
  const rating =
    reviewCount > 0 && Number.isFinite(rawRating) && rawRating > 0
      ? Math.min(5, Math.round(rawRating * 10) / 10)
      : 0;

  return { rating, reviewCount };
}

export function formatRatingPillLabel(rating: number, _reviewCount?: number): string {
  return rating.toFixed(1);
}
