import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const VOTES_COLLECTION = "review_votes";
const REVIEWS_COLLECTION = "reviews";

function voteDocId(reviewId: string, userId: string): string {
  return `${reviewId}_${userId}`;
}

export async function hasUserVotedReview(
  reviewId: string,
  userId: string
): Promise<boolean> {
  const db = getAdminFirestore();
  const doc = await db.collection(VOTES_COLLECTION).doc(voteDocId(reviewId, userId)).get();
  return doc.exists;
}

export async function voteReviewHelpful(
  reviewId: string,
  userId: string
): Promise<{ helpfulCount: number }> {
  const db = getAdminFirestore();
  const voteRef = db.collection(VOTES_COLLECTION).doc(voteDocId(reviewId, userId));
  const reviewRef = db.collection(REVIEWS_COLLECTION).doc(reviewId);

  const existingVote = await voteRef.get();
  if (existingVote.exists) {
    throw new Error("You have already marked this review as helpful");
  }

  const reviewDoc = await reviewRef.get();
  if (!reviewDoc.exists || reviewDoc.data()?.status !== "approved") {
    throw new Error("Review not found");
  }

  const now = new Date().toISOString();
  await voteRef.set({ reviewId, userId, createdAt: now });
  await reviewRef.update({
    helpfulCount: FieldValue.increment(1),
    updatedAt: now,
  });

  const updated = await reviewRef.get();
  return { helpfulCount: Number(updated.data()?.helpfulCount ?? 0) };
}

export async function getUserVotesForReviews(
  reviewIds: string[],
  userId: string
): Promise<Set<string>> {
  if (reviewIds.length === 0) return new Set();
  const db = getAdminFirestore();
  const voted = new Set<string>();

  await Promise.all(
    reviewIds.map(async (reviewId) => {
      const doc = await db.collection(VOTES_COLLECTION).doc(voteDocId(reviewId, userId)).get();
      if (doc.exists) voted.add(reviewId);
    })
  );

  return voted;
}
