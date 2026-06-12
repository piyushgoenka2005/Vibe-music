import { getAdminFirestore } from "@/lib/firebase/admin";
import type { ReviewDocument } from "@/types/admin";

const COLLECTION = "reviews";

function normalizeReview(id: string, data: FirebaseFirestore.DocumentData): ReviewDocument {
  return {
    id,
    productId: String(data.productId ?? ""),
    productName: data.productName ? String(data.productName) : undefined,
    userId: String(data.userId ?? ""),
    userEmail: data.userEmail ? String(data.userEmail) : undefined,
    author: String(data.author ?? "Anonymous"),
    rating: Number(data.rating ?? 0),
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    status: data.status === "approved" || data.status === "rejected" ? data.status : "pending",
    adminReply: data.adminReply ? String(data.adminReply) : undefined,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function listReviews(status?: ReviewDocument["status"]): Promise<ReviewDocument[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection(COLLECTION);

  if (status) {
    query = query.where("status", "==", status);
  }

  const snap = await query.orderBy("createdAt", "desc").get();
  if (snap.empty) {
    return seedReviewsFromStatic();
  }
  return snap.docs.map((doc) => normalizeReview(doc.id, doc.data()));
}

async function seedReviewsFromStatic(): Promise<ReviewDocument[]> {
  const { getAllProducts, getProductDetailBySlug } = await import(
    "@/services/catalogService"
  );
  const db = getAdminFirestore();
  const batch = db.batch();
  const reviews: ReviewDocument[] = [];
  const now = new Date().toISOString();

  getAllProducts(true).slice(0, 20).forEach((product) => {
    const detail = getProductDetailBySlug(product.slug);
    if (!detail) return;
    detail.reviews.slice(0, 2).forEach((review, index) => {
      const ref = db.collection(COLLECTION).doc();
      const record: ReviewDocument = {
        id: ref.id,
        productId: detail.id,
        productName: detail.name,
        userId: `seed-user-${product.slug}-${index}`,
        author: review.author,
        rating: review.rating,
        title: review.title,
        body: review.body,
        status: "approved",
        createdAt: review.date || now,
        updatedAt: now,
      };
      batch.set(ref, record);
      reviews.push(record);
    });
  });

  if (reviews.length > 0) {
    await batch.commit();
  }
  return reviews;
}

export async function updateReviewStatus(
  id: string,
  status: ReviewDocument["status"],
  adminReply?: string
): Promise<ReviewDocument> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status, updatedAt: now };
  if (adminReply !== undefined) patch.adminReply = adminReply;
  await db.collection(COLLECTION).doc(id).update(patch);
  const doc = await db.collection(COLLECTION).doc(id).get();
  return normalizeReview(doc.id, doc.data()!);
}

export async function deleteReview(id: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(id).delete();
}
