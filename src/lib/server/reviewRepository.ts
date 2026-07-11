import "server-only";

import * as pg from "@/lib/server/prisma/reviewRepository";
import { prismaToReview } from "@/lib/server/prisma/mappers";
import type {
  AdminReviewListParams,
  PublicReview,
  Review,
  ReviewListParams,
  ReviewStatus,
} from "@/types/review";

export const REVIEWS_COLLECTION = "reviews";
export const USER_PRODUCT_REVIEWS_COLLECTION = "user_product_reviews";

export function normalizeReview(
  id: string,
  data: Record<string, unknown>
): Review {
  return prismaToReview({
    id,
    productId: String(data.productId ?? ""),
    productName: String(data.productName ?? ""),
    productSlug: String(data.productSlug ?? ""),
    userId: String(data.userId ?? ""),
    userEmail: data.userEmail ? String(data.userEmail) : null,
    author: String(data.author ?? "Anonymous"),
    rating: Number(data.rating ?? 0),
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    images: data.images,
    hasImages: Boolean(data.hasImages),
    verifiedPurchase: Boolean(data.verifiedPurchase),
    orderId: data.orderId ? String(data.orderId) : null,
    status: String(data.status ?? "pending"),
    adminReply: data.adminReply ? String(data.adminReply) : null,
    rejectionReason: data.rejectionReason ? String(data.rejectionReason) : null,
    helpfulCount: Number(data.helpfulCount ?? 0),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  });
}

export function toPublicReview(review: Review, hasVoted?: boolean): PublicReview {
  const {
    userId: _userId,
    userEmail: _userEmail,
    rejectionReason: _rejectionReason,
    orderId: _orderId,
    ...rest
  } = review;
  void _userId;
  void _userEmail;
  void _rejectionReason;
  void _orderId;
  return { ...rest, hasVoted };
}

export const listProductReviews = pg.listProductReviews;
export const listAdminReviews = pg.listAdminReviews;
export const getReviewById = pg.getReviewById;
export const hasUserReviewedProduct = pg.hasUserReviewedProduct;
export const getUserReviewForProduct = pg.getUserReviewForProduct;
export const countReviewsByStatus = pg.countReviewsByStatus;
export const countApprovedToday = pg.countApprovedToday;
export const userProductReviewLockId = pg.userProductReviewLockId;

export async function createReviewRecord(
  input: Omit<Review, "id" | "helpfulCount" | "createdAt" | "updatedAt"> & {
    id?: string;
  }
): Promise<Review> {
  const { randomUUID } = await import("crypto");
  const now = new Date().toISOString();
  const record: Review = {
    ...input,
    id: input.id ?? randomUUID(),
    helpfulCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return pg.createReviewRecord(record);
}

export async function updateReviewFields(
  id: string,
  patch: Partial<Pick<Review, "status" | "adminReply" | "rejectionReason" | "updatedAt">>
): Promise<Review> {
  return pg.updateReviewFields(id, patch);
}

export async function deleteReviewRecord(id: string): Promise<Review | null> {
  return pg.deleteReviewRecord(id);
}

export type { ReviewStatus };
