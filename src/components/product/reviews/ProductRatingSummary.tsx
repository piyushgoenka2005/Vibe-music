"use client";

import StarRating from "./StarRating";
import type { ProductReviewStats } from "@/types/review";

interface ProductRatingSummaryProps {
  stats: ProductReviewStats;
  activeRating?: number;
  onRatingFilter?: (rating?: number) => void;
}

export default function ProductRatingSummary({
  stats,
  activeRating,
  onRatingFilter,
}: ProductRatingSummaryProps) {
  const maxCount = Math.max(...Object.values(stats.distribution), 1);
  const recommendPercent =
    stats.totalReviews > 0
      ? Math.round(
          ((stats.distribution["4"] + stats.distribution["5"]) / stats.totalReviews) * 100
        )
      : 0;

  return (
    <div className="pdp-review-summary">
      <div className="pdp-review-summary__score">
        <strong className="pdp-review-summary__average">
          {stats.averageRating.toFixed(1)}
        </strong>
        <StarRating value={stats.averageRating} size="lg" />
        <p>{stats.totalReviews} review{stats.totalReviews === 1 ? "" : "s"}</p>
        {stats.totalReviews > 0 ? (
          <p className="pdp-review-summary__recommend">{recommendPercent}% recommend</p>
        ) : null}
      </div>

      <div className="pdp-review-summary__bars" aria-label="Rating distribution">
        {([5, 4, 3, 2, 1] as const).map((rating) => {
          const count = stats.distribution[String(rating) as keyof typeof stats.distribution];
          const width = `${Math.round((count / maxCount) * 100)}%`;
          const isActive = activeRating === rating;
          return (
            <button
              key={rating}
              type="button"
              className={`pdp-review-summary__bar-row${isActive ? " pdp-review-summary__bar-row--active" : ""}`}
              onClick={() => onRatingFilter?.(isActive ? undefined : rating)}
            >
              <span>{rating}★</span>
              <span className="pdp-review-summary__bar-track">
                <span className="pdp-review-summary__bar-fill" style={{ width }} />
              </span>
              <span>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
