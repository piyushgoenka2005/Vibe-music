"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import type { ProductReview } from "@/types/product";

interface ProductFirestoreReviewsProps {
  productId: string;
  fallbackReviews: ProductReview[];
}

export default function ProductFirestoreReviews({
  productId,
  fallbackReviews,
}: ProductFirestoreReviewsProps) {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<ProductReview[]>(fallbackReviews);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reviews/${productId}`)
      .then((res) => res.json())
      .then((data: { reviews?: ProductReview[] }) => {
        if (data.reviews?.length) {
          setReviews([...data.reviews, ...fallbackReviews]);
        }
      })
      .catch(() => {});
  }, [fallbackReviews, productId]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      setMessage("Sign in to leave a review.");
      return;
    }
    const response = await fetch(`/api/reviews/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: user.name || "Verified Buyer",
        title,
        body,
        rating,
        verifiedPurchase: true,
      }),
    });
    if (!response.ok) {
      setMessage("Unable to submit review.");
      return;
    }
    setReviews((current) => [
      {
        id: `local-${Date.now()}`,
        author: user.name || "Verified Buyer",
        rating,
        title,
        body,
        date: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);
    setTitle("");
    setBody("");
    setMessage("Thanks for your review!");
  }

  return (
    <div>
      {reviews.map((review) => (
        <article key={review.id} className="pdp-review">
          <h4 className="pdp-review__title">{review.title}</h4>
          <p className="pdp-review__meta">
            <span className="pdp-rating__stars" aria-hidden="true">
              {"★".repeat(review.rating)}
            </span>{" "}
            {review.author} — {review.date}
          </p>
          <p>{review.body}</p>
        </article>
      ))}

      <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
        <h4>Write a review</h4>
        <label>
          Rating
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} stars
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          Review
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
        </label>
        <button type="submit" className="sw-btn sw-btn-blue" style={{ marginTop: 8 }}>
          Submit review
        </button>
        {message ? <p style={{ marginTop: 8 }}>{message}</p> : null}
      </form>
    </div>
  );
}
