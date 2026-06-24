import "server-only";

import { escapeHtml } from "@/lib/security/sanitize";
import { hasPurchasedProduct } from "@/lib/server/orderVerificationService";
import {
  countApprovedToday,
  countReviewsByStatus,
  createReviewRecord,
  deleteReviewRecord,
  getReviewById,
  listAdminReviews,
  listProductReviews,
  normalizeReview,
  updateReviewFields,
} from "@/lib/server/reviewRepository";
import { getReviewEligibility } from "@/lib/server/reviewEligibilityService";
import {
  getProductReviewStats,
  recalculateProductReviewStats,
} from "@/lib/server/reviewStatsService";
import { MAX_REVIEW_IMAGES } from "@/lib/validations/review";
import type {
  AdminReviewListParams,
  AdminReviewStats,
  CreateReviewInput,
  Review,
  ReviewListParams,
  ReviewListResponse,
  ReviewStatus,
} from "@/types/review";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { REVIEWS_COLLECTION } from "@/lib/server/reviewRepository";

async function seedReviewsFromStatic(): Promise<Review[]> {
  const { getAllProducts, getProductDetailBySlug } = await import(
    "@/services/catalogService"
  );
  const db = getAdminFirestore();
  const batch = db.batch();
  const reviews: Review[] = [];
  const now = new Date().toISOString();

  const products = (await getAllProducts(true)).slice(0, 20);
  for (const product of products) {
    const detail = await getProductDetailBySlug(product.slug);
    if (!detail) continue;
    detail.reviews.slice(0, 2).forEach((review, index) => {
      const ref = db.collection(REVIEWS_COLLECTION).doc();
      const record: Review = {
        id: ref.id,
        productId: detail.id,
        productName: detail.name,
        productSlug: detail.slug,
        userId: `seed-user-${product.slug}-${index}`,
        author: review.author,
        rating: review.rating,
        title: review.title,
        body: review.body,
        images: [],
        hasImages: false,
        verifiedPurchase: false,
        status: "approved",
        helpfulCount: 0,
        createdAt: review.date || now,
        updatedAt: now,
      };
      batch.set(ref, record);
      reviews.push(record);
    });
  }

  if (reviews.length > 0) {
    await batch.commit();
    const productIds = [...new Set(reviews.map((r) => r.productId))];
    await Promise.all(productIds.map((id) => recalculateProductReviewStats(id)));
  }
  return reviews;
}

export async function listReviewsForAdmin(params: AdminReviewListParams = {}) {
  const result = await listAdminReviews(params);
  if (result.reviews.length === 0 && !params.status && !params.productId) {
    const seeded = await seedReviewsFromStatic();
    return {
      reviews: seeded.slice(0, params.limit ?? 20),
      hasMore: false,
    };
  }
  return result;
}

export async function listReviewsForProduct(
  params: ReviewListParams
): Promise<ReviewListResponse> {
  const stats = await getProductReviewStats(params.productId);
  const result = await listProductReviews(params);
  return {
    ...result,
    totalCount: stats.totalReviews,
  };
}

export async function submitProductReview(input: {
  productId: string;
  productName: string;
  productSlug: string;
  userId: string;
  userEmail?: string;
  author: string;
  payload: CreateReviewInput;
}): Promise<Review> {
  const eligibility = await getReviewEligibility(
    input.userId,
    input.userEmail,
    input.productId
  );
  if (!eligibility.canReview) {
    throw new Error(eligibility.reason ?? "You cannot review this product");
  }

  const purchase = await hasPurchasedProduct(
    input.userId,
    input.userEmail,
    input.productId
  );
  const images = (input.payload.images ?? []).slice(0, MAX_REVIEW_IMAGES);

  const review = await createReviewRecord({
    productId: input.productId,
    productName: input.productName,
    productSlug: input.productSlug,
    userId: input.userId,
    userEmail: input.userEmail,
    author: escapeHtml(input.author.trim() || "Customer"),
    rating: input.payload.rating,
    title: escapeHtml(input.payload.title.trim()),
    body: escapeHtml(input.payload.body.trim()),
    images,
    hasImages: images.length > 0,
    verifiedPurchase: purchase.verified,
    orderId: purchase.orderId,
    status: "pending",
  });

  return review;
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus,
  options: { adminReply?: string; rejectionReason?: string } = {}
): Promise<Review> {
  const existing = await getReviewById(id);
  if (!existing) throw new Error("Review not found");

  const review = await updateReviewFields(id, {
    status,
    adminReply: options.adminReply,
    rejectionReason: options.rejectionReason,
  });

  if (existing.status !== status) {
    await recalculateProductReviewStats(review.productId);
  }

  return review;
}

export async function deleteReview(id: string): Promise<void> {
  const review = await deleteReviewRecord(id);
  if (!review) throw new Error("Review not found");
  if (review.status === "approved") {
    await recalculateProductReviewStats(review.productId);
  }
}

export async function getAdminReviewStats(): Promise<AdminReviewStats> {
  const counts = await countReviewsByStatus();
  const approvedToday = await countApprovedToday();
  return {
    pending: counts.pending,
    approved: counts.approved,
    rejected: counts.rejected,
    approvedToday,
  };
}

export { getReviewEligibility, getProductReviewStats, normalizeReview };
