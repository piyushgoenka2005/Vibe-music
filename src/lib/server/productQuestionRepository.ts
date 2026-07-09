import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  ProductQuestion,
  ProductQuestionListResponse,
  ProductQuestionStatus,
} from "@/types/productQuestion";

export const PRODUCT_QUESTIONS_COLLECTION = "productQuestions";

function normalizeQuestion(
  id: string,
  data: FirebaseFirestore.DocumentData
): ProductQuestion {
  return {
    id,
    productId: String(data.productId ?? ""),
    productSlug: String(data.productSlug ?? ""),
    productName: String(data.productName ?? ""),
    userId: data.userId ? String(data.userId) : undefined,
    author: String(data.author ?? "Customer"),
    question: String(data.question ?? ""),
    answer: data.answer ? String(data.answer) : undefined,
    answeredBy: data.answeredBy ? String(data.answeredBy) : undefined,
    status: (data.status as ProductQuestionStatus) ?? "pending",
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function createProductQuestion(
  input: Omit<ProductQuestion, "id" | "status" | "createdAt" | "updatedAt" | "answer" | "answeredBy">
): Promise<ProductQuestion> {
  const db = getAdminFirestore();
  const ref = db.collection(PRODUCT_QUESTIONS_COLLECTION).doc();
  const now = new Date().toISOString();
  const record: ProductQuestion = {
    id: ref.id,
    ...input,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(record);
  return record;
}

export async function getProductQuestionById(
  id: string
): Promise<ProductQuestion | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(PRODUCT_QUESTIONS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return normalizeQuestion(doc.id, doc.data()!);
}

export async function listApprovedQuestionsForProduct(
  productId: string
): Promise<ProductQuestionListResponse> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(PRODUCT_QUESTIONS_COLLECTION)
    .where("productId", "==", productId)
    .get();

  const questions = snap.docs
    .map((doc) => normalizeQuestion(doc.id, doc.data()))
    .filter((item) => item.status === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { questions, totalCount: questions.length };
}

export async function listProductQuestionsForAdmin(options: {
  status?: ProductQuestionStatus;
  productId?: string;
  limit?: number;
} = {}): Promise<ProductQuestion[]> {
  const db = getAdminFirestore();
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  let query: FirebaseFirestore.Query = db.collection(PRODUCT_QUESTIONS_COLLECTION);

  if (options.productId) {
    query = query.where("productId", "==", options.productId);
  } else if (options.status) {
    query = query.where("status", "==", options.status);
  }

  const snap = await query.limit(limit).get();
  return snap.docs
    .map((doc) => normalizeQuestion(doc.id, doc.data()))
    .filter((item) => !options.status || item.status === options.status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateProductQuestion(
  id: string,
  patch: Partial<
    Pick<ProductQuestion, "status" | "answer" | "answeredBy" | "question">
  >
): Promise<ProductQuestion> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  await db.collection(PRODUCT_QUESTIONS_COLLECTION).doc(id).update({
    ...patch,
    updatedAt: now,
  });
  const updated = await getProductQuestionById(id);
  if (!updated) throw new Error("Question not found after update");
  return updated;
}
