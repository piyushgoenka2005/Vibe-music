import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { tryFirestoreFast } from "@/lib/server/firestoreErrors";
import type {
  AdminReviewListParams,
  PublicReview,
  Review,
  ReviewListParams,
  ReviewSortOption,
  ReviewStatus,
} from "@/types/review";
import {
  deleteVotesForReview,
  getUserVotesForReviews,
} from "@/lib/server/reviewVoteService";

export const REVIEWS_COLLECTION = "reviews";
export const USER_PRODUCT_REVIEWS_COLLECTION = "user_product_reviews";

export function normalizeReview(
  id: string,
  data: FirebaseFirestore.DocumentData
): Review {
  const images = Array.isArray(data.images)
    ? data.images.map((url: unknown) => String(url))
    : [];

  return {
    id,
    productId: String(data.productId ?? ""),
    productName: String(data.productName ?? ""),
    productSlug: String(data.productSlug ?? ""),
    userId: String(data.userId ?? ""),
    userEmail: data.userEmail ? String(data.userEmail) : undefined,
    author: String(data.author ?? "Anonymous"),
    rating: Number(data.rating ?? 0),
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    images,
    hasImages: Boolean(data.hasImages ?? images.length > 0),
    verifiedPurchase: Boolean(data.verifiedPurchase),
    orderId: data.orderId ? String(data.orderId) : undefined,
    status:
      data.status === "approved" || data.status === "rejected"
        ? data.status
        : "pending",
    adminReply: data.adminReply ? String(data.adminReply) : undefined,
    rejectionReason: data.rejectionReason ? String(data.rejectionReason) : undefined,
    helpfulCount: Number(data.helpfulCount ?? 0),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
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

function applySort(
  query: FirebaseFirestore.Query,
  sort: ReviewSortOption
): FirebaseFirestore.Query {
  switch (sort) {
    case "oldest":
      return query.orderBy("createdAt", "asc");
    case "highest":
      return query.orderBy("rating", "desc").orderBy("createdAt", "desc");
    case "lowest":
      return query.orderBy("rating", "asc").orderBy("createdAt", "desc");
    case "helpful":
      return query.orderBy("helpfulCount", "desc").orderBy("createdAt", "desc");
    case "newest":
    default:
      return query.orderBy("createdAt", "desc");
  }
}

function applyFilters(
  query: FirebaseFirestore.Query,
  params: Pick<ReviewListParams, "rating" | "verified" | "hasImages">
): FirebaseFirestore.Query {
  let next = query;
  if (params.rating !== undefined) {
    next = next.where("rating", "==", params.rating);
  }
  if (params.verified === true) {
    next = next.where("verifiedPurchase", "==", true);
  }
  if (params.hasImages === true) {
    next = next.where("hasImages", "==", true);
  }
  return next;
}

function countActiveFilters(
  params: Pick<ReviewListParams, "rating" | "verified" | "hasImages">
): number {
  let count = 0;
  if (params.rating !== undefined) count += 1;
  if (params.verified === true) count += 1;
  if (params.hasImages === true) count += 1;
  return count;
}

function matchesReviewFilters(
  review: Review,
  params: Pick<ReviewListParams, "rating" | "verified" | "hasImages">
): boolean {
  if (params.rating !== undefined && review.rating !== params.rating) {
    return false;
  }
  if (params.verified === true && !review.verifiedPurchase) {
    return false;
  }
  if (params.hasImages === true && !review.hasImages) {
    return false;
  }
  return true;
}

function sortReviewList(
  reviews: Review[],
  sort: ReviewSortOption
): Review[] {
  const copy = [...reviews];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "highest":
      return copy.sort(
        (a, b) =>
          b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
      );
    case "lowest":
      return copy.sort(
        (a, b) =>
          a.rating - b.rating || b.createdAt.localeCompare(a.createdAt)
      );
    case "helpful":
      return copy.sort(
        (a, b) =>
          b.helpfulCount - a.helpfulCount ||
          b.createdAt.localeCompare(a.createdAt)
      );
    case "newest":
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

async function listProductReviewsInMemory(
  params: ReviewListParams
): Promise<{ reviews: PublicReview[]; hasMore: boolean; nextCursor?: string }> {
  return tryFirestoreFast(
    () => listProductReviewsInMemoryFromFirestore(params),
    {
      domain: "reviews",
      context: `in-memory list for ${params.productId}`,
      fallback: () => ({ reviews: [], hasMore: false }),
    }
  );
}

async function listProductReviewsInMemoryFromFirestore(
  params: ReviewListParams
): Promise<{ reviews: PublicReview[]; hasMore: boolean; nextCursor?: string }> {
  const db = getAdminFirestore();
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 20);
  const sort = params.sort ?? "newest";

  const snap = await db
    .collection(REVIEWS_COLLECTION)
    .where("productId", "==", params.productId)
    .where("status", "==", "approved")
    .get();

  const filtered = sortReviewList(
    snap.docs
      .map((doc) => normalizeReview(doc.id, doc.data()))
      .filter((review) => matchesReviewFilters(review, params)),
    sort
  );

  let startIndex = 0;
  if (params.cursor) {
    const cursorIndex = filtered.findIndex((review) => review.id === params.cursor);
    if (cursorIndex >= 0) startIndex = cursorIndex + 1;
  }

  const page = filtered.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < filtered.length;

  let votedIds = new Set<string>();
  if (params.viewerUserId && page.length > 0) {
    votedIds = await getUserVotesForReviews(
      page.map((review) => review.id),
      params.viewerUserId
    );
  }

  return {
    reviews: page.map((review) => toPublicReview(review, votedIds.has(review.id))),
    hasMore,
    nextCursor: hasMore && page.length > 0 ? page[page.length - 1]!.id : undefined,
  };
}
async function paginateReviewQuery(
  query: FirebaseFirestore.Query,
  limit: number,
  cursor?: string
): Promise<{ docs: FirebaseFirestore.QueryDocumentSnapshot[]; hasMore: boolean }> {
  const db = getAdminFirestore();
  let paged = query;

  if (cursor) {
    const cursorDoc = await db.collection(REVIEWS_COLLECTION).doc(cursor).get();
    if (cursorDoc.exists) {
      paged = paged.startAfter(cursorDoc);
    }
  }

  const snap = await paged.limit(limit + 1).get();
  const hasMore = snap.docs.length > limit;
  return { docs: snap.docs.slice(0, limit), hasMore };
}

export async function listProductReviews(
  params: ReviewListParams
): Promise<{ reviews: PublicReview[]; hasMore: boolean; nextCursor?: string }> {
  if (countActiveFilters(params) > 1) {
    return listProductReviewsInMemory(params);
  }

  return tryFirestoreFast(
    () => listProductReviewsFromFirestore(params),
    {
      domain: "reviews",
      context: `list for ${params.productId}`,
      fallback: () => ({ reviews: [], hasMore: false }),
    }
  );
}

async function listProductReviewsFromFirestore(
  params: ReviewListParams
): Promise<{ reviews: PublicReview[]; hasMore: boolean; nextCursor?: string }> {
  const db = getAdminFirestore();
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 20);
  const sort = params.sort ?? "newest";

  let query: FirebaseFirestore.Query = db
    .collection(REVIEWS_COLLECTION)
    .where("productId", "==", params.productId)
    .where("status", "==", "approved");

  query = applyFilters(query, params);
  query = applySort(query, sort);

  const { docs, hasMore } = await paginateReviewQuery(query, limit, params.cursor);
  const reviews = docs.map((doc) => normalizeReview(doc.id, doc.data()));

  let votedIds = new Set<string>();
  if (params.viewerUserId && reviews.length > 0) {
    votedIds = await getUserVotesForReviews(
      reviews.map((r) => r.id),
      params.viewerUserId
    );
  }

  return {
    reviews: reviews.map((r) => toPublicReview(r, votedIds.has(r.id))),
    hasMore,
    nextCursor: hasMore && docs.length > 0 ? docs[docs.length - 1]!.id : undefined,
  };
}

export async function listAdminReviews(
  params: AdminReviewListParams
): Promise<{ reviews: Review[]; hasMore: boolean; nextCursor?: string }> {
  const db = getAdminFirestore();
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const sort = params.sort ?? "newest";

  let query: FirebaseFirestore.Query = db.collection(REVIEWS_COLLECTION);

  if (params.status) {
    query = query.where("status", "==", params.status);
  }
  if (params.productId) {
    query = query.where("productId", "==", params.productId);
  }
  if (params.rating !== undefined) {
    query = query.where("rating", "==", params.rating);
  }
  if (params.verified === true) {
    query = query.where("verifiedPurchase", "==", true);
  }
  if (params.hasImages === true) {
    query = query.where("hasImages", "==", true);
  }

  query = applySort(query, sort);

  const { docs, hasMore } = await paginateReviewQuery(query, limit, params.cursor);
  return {
    reviews: docs.map((doc) => normalizeReview(doc.id, doc.data())),
    hasMore,
    nextCursor: hasMore && docs.length > 0 ? docs[docs.length - 1]!.id : undefined,
  };
}

export async function getReviewById(id: string): Promise<Review | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(REVIEWS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return normalizeReview(doc.id, doc.data()!);
}

export function userProductReviewLockId(userId: string, productId: string): string {
  return `${userId}_${productId}`;
}

export async function hasUserReviewedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  return tryFirestoreFast(
    async () => {
      const db = getAdminFirestore();
      const doc = await db
        .collection(USER_PRODUCT_REVIEWS_COLLECTION)
        .doc(userProductReviewLockId(userId, productId))
        .get();
      return doc.exists;
    },
    {
      domain: "reviews",
      context: `review lock for ${userId}/${productId}`,
      fallback: () => false,
    }
  );
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string
): Promise<Review | null> {
  const db = getAdminFirestore();
  const lock = await db
    .collection(USER_PRODUCT_REVIEWS_COLLECTION)
    .doc(userProductReviewLockId(userId, productId))
    .get();
  if (!lock.exists) return null;
  const reviewId = String(lock.data()?.reviewId ?? "");
  if (!reviewId) return null;
  return getReviewById(reviewId);
}

export async function createReviewRecord(
  input: Omit<Review, "id" | "helpfulCount" | "createdAt" | "updatedAt"> & {
    id?: string;
  }
): Promise<Review> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const ref = input.id
    ? db.collection(REVIEWS_COLLECTION).doc(input.id)
    : db.collection(REVIEWS_COLLECTION).doc();

  const record: Review = {
    ...input,
    id: ref.id,
    helpfulCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(ref, record);
  batch.set(
    db.collection(USER_PRODUCT_REVIEWS_COLLECTION).doc(
      userProductReviewLockId(record.userId, record.productId)
    ),
    {
      userId: record.userId,
      productId: record.productId,
      reviewId: record.id,
      createdAt: now,
    }
  );
  await batch.commit();
  return record;
}

export async function updateReviewFields(
  id: string,
  patch: Partial<Pick<Review, "status" | "adminReply" | "rejectionReason" | "updatedAt">>
): Promise<Review> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  await db
    .collection(REVIEWS_COLLECTION)
    .doc(id)
    .update({ ...patch, updatedAt: now });
  const doc = await db.collection(REVIEWS_COLLECTION).doc(id).get();
  return normalizeReview(doc.id, doc.data()!);
}

export async function deleteReviewRecord(id: string): Promise<Review | null> {
  const db = getAdminFirestore();
  const review = await getReviewById(id);
  if (!review) return null;

  await deleteVotesForReview(id);

  const batch = db.batch();
  batch.delete(db.collection(REVIEWS_COLLECTION).doc(id));
  batch.delete(
    db.collection(USER_PRODUCT_REVIEWS_COLLECTION).doc(
      userProductReviewLockId(review.userId, review.productId)
    )
  );
  await batch.commit();
  return review;
}

export async function countReviewsByStatus(): Promise<Record<ReviewStatus, number>> {
  const db = getAdminFirestore();
  const counts: Record<ReviewStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  await Promise.all(
    (["pending", "approved", "rejected"] as ReviewStatus[]).map(async (status) => {
      const snap = await db
        .collection(REVIEWS_COLLECTION)
        .where("status", "==", status)
        .count()
        .get();
      counts[status] = snap.data().count;
    })
  );

  return counts;
}

export async function countApprovedToday(): Promise<number> {
  const db = getAdminFirestore();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const snap = await db
    .collection(REVIEWS_COLLECTION)
    .where("status", "==", "approved")
    .where("updatedAt", ">=", start.toISOString())
    .count()
    .get();
  return snap.data().count;
}
