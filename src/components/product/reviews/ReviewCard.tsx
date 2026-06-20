"use client";

import HelpfulVoteButton from "./HelpfulVoteButton";
import ReviewCardImages from "./ReviewCardImages";
import StarRating from "./StarRating";
import VerifiedPurchaseBadge from "./VerifiedPurchaseBadge";
import type { PublicReview } from "@/types/review";

interface ReviewCardProps {
  review: PublicReview;
  productSlug: string;
}

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReviewCard({ review, productSlug }: ReviewCardProps) {
  return (
    <article className="pdp-review-card">
      <div className="pdp-review-card__header">
        <div>
          <div className="pdp-review-card__meta">
            <StarRating value={review.rating} size="sm" />
            <span className="pdp-review-card__author">{review.author}</span>
            <span className="pdp-review-card__date">{formatReviewDate(review.createdAt)}</span>
            {review.verifiedPurchase ? <VerifiedPurchaseBadge /> : null}
          </div>
          <h4 className="pdp-review-card__title">{review.title}</h4>
        </div>
      </div>

      <p className="pdp-review-card__body">{review.body}</p>
      <ReviewCardImages images={review.images} title={review.title} />

      {review.adminReply ? (
        <div className="pdp-review-card__reply">
          <strong>Store reply:</strong> {review.adminReply}
        </div>
      ) : null}

      <HelpfulVoteButton
        reviewId={review.id}
        productSlug={productSlug}
        count={review.helpfulCount}
        hasVoted={review.hasVoted}
      />
    </article>
  );
}
