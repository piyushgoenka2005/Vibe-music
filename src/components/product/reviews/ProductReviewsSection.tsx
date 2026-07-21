"use client";

import { useMemo, useState } from "react";
import { useProductReviewStats } from "@/hooks/useProductReviewStats";
import { useProductReviews, type ProductReviewFilters } from "@/hooks/useProductReviews";
import type { ReviewSortOption } from "@/types/review";
import ProductRatingSummary from "./ProductRatingSummary";
import ReviewCard from "./ReviewCard";
import ReviewFiltersBar from "./ReviewFiltersBar";
import ReviewSubmitForm from "./ReviewSubmitForm";

interface ProductReviewsSectionProps {
  productSlug: string;
  productId: string;
}

export default function ProductReviewsSection({
  productSlug,
}: ProductReviewsSectionProps) {
  const [sort, setSort] = useState<ReviewSortOption>("newest");
  const [rating, setRating] = useState<number | undefined>();
  const [verified, setVerified] = useState(false);
  const [hasImages, setHasImages] = useState(false);

  const filters = useMemo<ProductReviewFilters>(
    () => ({
      sort,
      rating,
      verified: verified || undefined,
      hasImages: hasImages || undefined,
    }),
    [sort, rating, verified, hasImages]
  );

  const statsQuery = useProductReviewStats(productSlug);
  const reviewsQuery = useProductReviews(productSlug, filters);

  const reviews = reviewsQuery.data?.pages.flatMap((page) => page.reviews) ?? [];
  const totalCount = reviewsQuery.data?.pages[0]?.totalCount ?? statsQuery.data?.totalReviews ?? 0;

  return (
    <div className="pdp-reviews-section">
      {statsQuery.data ? (
        <ProductRatingSummary
          stats={statsQuery.data}
          activeRating={rating}
          onRatingFilter={setRating}
        />
      ) : null}

      <ReviewSubmitForm productSlug={productSlug} />

      <ReviewFiltersBar
        sort={sort}
        rating={rating}
        verified={verified}
        hasImages={hasImages}
        onSortChange={setSort}
        onRatingChange={setRating}
        onVerifiedChange={setVerified}
        onHasImagesChange={setHasImages}
      />

      {reviewsQuery.isLoading ? (
        <p className="pdp-sections__status">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="pdp-sections__empty">No reviews match your filters yet.</p>
      ) : (
        <div className="pdp-sections__panel pdp-reviews-section__list">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} productSlug={productSlug} />
          ))}
        </div>
      )}

      <div className="pdp-reviews-section__footer">
        <p>
          Showing {reviews.length} of {totalCount} review{totalCount === 1 ? "" : "s"}
        </p>
        {reviewsQuery.hasNextPage ? (
          <button
            type="button"
            className="pdp-reviews-section__load-more"
            disabled={reviewsQuery.isFetchingNextPage}
            onClick={() => void reviewsQuery.fetchNextPage()}
          >
            {reviewsQuery.isFetchingNextPage ? "Loading…" : "Load more reviews"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
