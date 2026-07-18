import "server-only";

import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import { withSyntheticReviewDates } from "@/lib/reviews/syntheticReviewDate";
import type {
  AdminReviewListParams,
  PublicReview,
  Review,
  ReviewListParams,
  ReviewStatus,
} from "@/types/review";
import { prismaToReview, reviewToPrisma } from "./mappers";

function toPublicReview(review: Review, hasVoted?: boolean): PublicReview {
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

function sortReviews(reviews: Review[], sort: string): Review[] {
  const copy = [...reviews];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "highest":
      return copy.sort(
        (a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
      );
    case "lowest":
      return copy.sort(
        (a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt)
      );
    case "helpful":
      return copy.sort(
        (a, b) =>
          b.helpfulCount - a.helpfulCount || b.createdAt.localeCompare(a.createdAt)
      );
    case "newest":
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

function paginate<T extends { id: string }>(
  items: T[],
  limit: number,
  cursor?: string
): { items: T[]; hasMore: boolean; nextCursor?: string } {
  let start = 0;
  if (cursor) {
    const index = items.findIndex((item) => item.id === cursor);
    if (index >= 0) start = index + 1;
  }
  const slice = items.slice(start, start + limit + 1);
  const hasMore = slice.length > limit;
  const page = slice.slice(0, limit);
  return {
    items: page,
    hasMore,
    nextCursor: hasMore && page.length > 0 ? page[page.length - 1]!.id : undefined,
  };
}

export async function getReviewById(id: string): Promise<Review | null> {
  if (!isPostgresConfigured()) return null;
  const row = await prisma.review.findUnique({ where: { id } });
  return row ? prismaToReview(row) : null;
}

export async function listReviewsByProductId(
  productId: string,
  status: ReviewStatus = "approved"
): Promise<Review[]> {
  if (!isPostgresConfigured()) return [];
  const rows = await prisma.review.findMany({
    where: { productId, status },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(prismaToReview);
}

export async function listProductReviews(
  params: ReviewListParams
): Promise<{ reviews: PublicReview[]; hasMore: boolean; nextCursor?: string }> {
  if (!isPostgresConfigured()) {
    return { reviews: [], hasMore: false };
  }
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 20);
  const where: {
    productId: string;
    status: string;
    rating?: number;
    verifiedPurchase?: boolean;
    hasImages?: boolean;
  } = {
    productId: params.productId,
    status: "approved",
  };

  if (params.rating !== undefined) where.rating = params.rating;
  if (params.verified === true) where.verifiedPurchase = true;
  if (params.hasImages === true) where.hasImages = true;

  let reviews = (await prisma.review.findMany({ where })).map(prismaToReview);
  // Synthetic catalog reviews get rolling dates across the last 3 years.
  reviews = withSyntheticReviewDates(reviews);
  reviews = sortReviews(reviews, params.sort ?? "newest");
  const page = paginate(reviews, limit, params.cursor);

  let votedIds = new Set<string>();
  if (params.viewerUserId && page.items.length > 0) {
    const votes = await prisma.reviewVote.findMany({
      where: {
        userId: params.viewerUserId,
        reviewId: { in: page.items.map((review) => review.id) },
      },
      select: { reviewId: true },
    });
    votedIds = new Set(votes.map((vote) => vote.reviewId));
  }

  return {
    reviews: page.items.map((review) =>
      toPublicReview(review, votedIds.has(review.id))
    ),
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  };
}

export async function listAdminReviews(
  params: AdminReviewListParams
): Promise<{ reviews: Review[]; hasMore: boolean; nextCursor?: string }> {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const where: {
    status?: string;
    productId?: string;
    rating?: number;
    verifiedPurchase?: boolean;
    hasImages?: boolean;
  } = {};

  if (params.status) where.status = params.status;
  if (params.productId) where.productId = params.productId;
  if (params.rating !== undefined) where.rating = params.rating;
  if (params.verified === true) where.verifiedPurchase = true;
  if (params.hasImages === true) where.hasImages = true;

  let reviews = (await prisma.review.findMany({ where })).map(prismaToReview);
  reviews = sortReviews(reviews, params.sort ?? "newest");
  const page = paginate(reviews, limit, params.cursor);
  return {
    reviews: page.items,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  };
}

export async function hasUserReviewedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  const lock = await prisma.userProductReview.findFirst({
    where: { userId, productId },
  });
  return Boolean(lock);
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string
): Promise<Review | null> {
  const lock = await prisma.userProductReview.findFirst({
    where: { userId, productId },
  });
  if (!lock) return null;
  return getReviewById(lock.reviewId);
}

export async function countReviewsByStatus(): Promise<Record<ReviewStatus, number>> {
  const counts: Record<ReviewStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  await Promise.all(
    (["pending", "approved", "rejected"] as ReviewStatus[]).map(async (status) => {
      counts[status] = await prisma.review.count({ where: { status } });
    })
  );
  return counts;
}

export async function countApprovedToday(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.review.count({
    where: {
      status: "approved",
      updatedAt: { gte: start.toISOString() },
    },
  });
}

export async function upsertReview(review: Review): Promise<void> {
  await prisma.review.upsert({
    where: { id: review.id },
    create: reviewToPrisma(review),
    update: reviewToPrisma(review),
  });
}

export async function deleteReview(id: string): Promise<void> {
  await prisma.review.delete({ where: { id } });
}

export function userProductReviewLockId(userId: string, productId: string): string {
  return `${userId}_${productId}`;
}

export async function createReviewRecord(review: Review): Promise<Review> {
  await prisma.$transaction([
    prisma.review.create({ data: reviewToPrisma(review) }),
    prisma.userProductReview.create({
      data: {
        id: userProductReviewLockId(review.userId, review.productId),
        userId: review.userId,
        productId: review.productId,
        reviewId: review.id,
        createdAt: review.createdAt,
      },
    }),
  ]);
  return review;
}

export async function updateReviewFields(
  id: string,
  patch: Partial<Pick<Review, "status" | "adminReply" | "rejectionReason" | "updatedAt" | "helpfulCount">>
): Promise<Review> {
  const now = new Date().toISOString();
  const row = await prisma.review.update({
    where: { id },
    data: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.adminReply !== undefined ? { adminReply: patch.adminReply ?? null } : {}),
      ...(patch.rejectionReason !== undefined
        ? { rejectionReason: patch.rejectionReason ?? null }
        : {}),
      ...(patch.helpfulCount !== undefined ? { helpfulCount: patch.helpfulCount } : {}),
      updatedAt: patch.updatedAt ?? now,
    },
  });
  return prismaToReview(row);
}

export async function deleteReviewRecord(id: string): Promise<Review | null> {
  const review = await getReviewById(id);
  if (!review) return null;

  await prisma.$transaction([
    prisma.reviewVote.deleteMany({ where: { reviewId: id } }),
    prisma.userProductReview.deleteMany({
      where: { userId: review.userId, productId: review.productId },
    }),
    prisma.review.delete({ where: { id } }),
  ]);

  return review;
}

export async function incrementReviewHelpfulCount(
  reviewId: string
): Promise<number> {
  const row = await prisma.review.update({
    where: { id: reviewId },
    data: {
      helpfulCount: { increment: 1 },
      updatedAt: new Date().toISOString(),
    },
  });
  return row.helpfulCount;
}
