"use client";

import type { ReviewSortOption } from "@/types/review";

interface ReviewFiltersBarProps {
  sort: ReviewSortOption;
  rating?: number;
  verified?: boolean;
  hasImages?: boolean;
  onSortChange: (sort: ReviewSortOption) => void;
  onRatingChange: (rating?: number) => void;
  onVerifiedChange: (verified: boolean) => void;
  onHasImagesChange: (hasImages: boolean) => void;
}

const SORT_OPTIONS: Array<{ value: ReviewSortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
  { value: "helpful", label: "Most helpful" },
];

export default function ReviewFiltersBar({
  sort,
  rating,
  verified,
  hasImages,
  onSortChange,
  onRatingChange,
  onVerifiedChange,
  onHasImagesChange,
}: ReviewFiltersBarProps) {
  return (
    <div className="pdp-review-filters">
      <label className="pdp-review-filters__field">
        <span>Sort</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ReviewSortOption)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="pdp-review-filters__field">
        <span>Rating</span>
        <select
          value={rating ?? ""}
          onChange={(event) =>
            onRatingChange(event.target.value ? Number(event.target.value) : undefined)
          }
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} stars
            </option>
          ))}
        </select>
      </label>

      <label className="pdp-review-filters__check">
        <input
          type="checkbox"
          checked={Boolean(verified)}
          onChange={(event) => onVerifiedChange(event.target.checked)}
        />
        Verified purchase
      </label>

      <label className="pdp-review-filters__check">
        <input
          type="checkbox"
          checked={Boolean(hasImages)}
          onChange={(event) => onHasImagesChange(event.target.checked)}
        />
        With photos
      </label>
    </div>
  );
}
