"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useReviewEligibility } from "@/hooks/useReviewEligibility";
import { submitProductReview } from "@/services/review.service";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import ReviewImageUpload from "./ReviewImageUpload";
import StarRating from "./StarRating";
import VerifiedPurchaseBadge from "./VerifiedPurchaseBadge";

interface ReviewSubmitFormProps {
  productSlug: string;
}

export default function ReviewSubmitForm({ productSlug }: ReviewSubmitFormProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const { data: eligibility, isLoading } = useReviewEligibility(productSlug);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isInitialized) return null;

  if (!isAuthenticated) {
    return (
      <div className="pdp-review-form pdp-review-form--notice">
        <p>
          <Link href={`/login?redirect=/product/${productSlug}`}>Sign in</Link> to write a review.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="pdp-review-form pdp-review-form--notice">Checking review eligibility…</div>;
  }

  if (!eligibility?.canReview) {
    return (
      <div className="pdp-review-form pdp-review-form--notice">
        <p>{eligibility?.reason ?? "You cannot review this product."}</p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await submitProductReview(productSlug, { rating, title, body, images });
      showToast("Thanks! Your review is pending moderation.", "success");
      setTitle("");
      setBody("");
      setImages([]);
      setRating(5);
      void queryClient.invalidateQueries({ queryKey: ["product-reviews", productSlug] });
      void queryClient.invalidateQueries({ queryKey: ["product-review-stats", productSlug] });
      void queryClient.invalidateQueries({ queryKey: ["review-eligibility", productSlug] });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to submit review", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="pdp-review-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="pdp-review-form__header">
        <h3>Write a review</h3>
        {eligibility.verifiedPurchase ? <VerifiedPurchaseBadge /> : null}
      </div>

      <label className="pdp-review-form__field">
        <span>Rating</span>
        <StarRating value={rating} interactive onChange={setRating} />
      </label>

      <label className="pdp-review-form__field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          maxLength={120}
          required
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label className="pdp-review-form__field">
        <span>Review</span>
        <textarea
          value={body}
          minLength={20}
          maxLength={2000}
          rows={5}
          required
          onChange={(event) => setBody(event.target.value)}
        />
      </label>

      <ReviewImageUpload
        productSlug={productSlug}
        images={images}
        onChange={setImages}
        disabled={isSubmitting}
      />

      <button type="submit" className="pdp-review-form__submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
