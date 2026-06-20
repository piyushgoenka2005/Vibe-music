import type {
  CreateReviewInput,
  ProductReviewStats,
  PublicReview,
  ReviewEligibility,
  ReviewListResponse,
  ReviewSortOption,
} from "@/types/review";

export interface ReviewListQuery {
  sort?: ReviewSortOption;
  rating?: number;
  verified?: boolean;
  hasImages?: boolean;
  cursor?: string;
  limit?: number;
}

export async function fetchProductReviews(
  slug: string,
  query: ReviewListQuery = {}
): Promise<ReviewListResponse> {
  const params = new URLSearchParams();
  if (query.sort) params.set("sort", query.sort);
  if (query.rating) params.set("rating", String(query.rating));
  if (query.verified) params.set("verified", "true");
  if (query.hasImages) params.set("hasImages", "true");
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit) params.set("limit", String(query.limit));

  const qs = params.toString();
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    throw new Error("Failed to load reviews");
  }
  return res.json() as Promise<ReviewListResponse>;
}

export async function fetchProductReviewStats(slug: string): Promise<ProductReviewStats> {
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews/stats`);
  if (!res.ok) {
    throw new Error("Failed to load review stats");
  }
  const data = (await res.json()) as { stats: ProductReviewStats };
  return data.stats;
}

export async function fetchReviewEligibility(slug: string): Promise<ReviewEligibility> {
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews/eligibility`);
  if (!res.ok) {
    throw new Error("Failed to check review eligibility");
  }
  const data = (await res.json()) as { eligibility: ReviewEligibility };
  return data.eligibility;
}

export async function submitProductReview(
  slug: string,
  payload: CreateReviewInput
): Promise<PublicReview> {
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to submit review");
  }
  const data = (await res.json()) as { review: PublicReview };
  return data.review;
}

export async function uploadReviewImages(
  productSlug: string,
  files: File[]
): Promise<string[]> {
  const formData = new FormData();
  formData.set("productSlug", productSlug);
  files.forEach((file) => formData.append("files", file));

  const res = await fetch("/api/reviews/upload-images", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to upload images");
  }
  const data = (await res.json()) as { urls: string[] };
  return data.urls;
}

export async function voteReviewHelpful(reviewId: string): Promise<number> {
  const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/vote`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to vote");
  }
  const data = (await res.json()) as { helpfulCount: number };
  return data.helpfulCount;
}
