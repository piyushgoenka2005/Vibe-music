import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type {
  ProductQuestion,
  ProductQuestionListResponse,
  ProductQuestionStatus,
} from "@/types/productQuestion";

export const PRODUCT_QUESTIONS_COLLECTION = "productQuestions";

function mapQuestion(row: {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  userId: string | null;
  author: string;
  question: string;
  answer: string | null;
  answeredBy: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}): ProductQuestion {
  return {
    id: row.id,
    productId: row.productId,
    productSlug: row.productSlug,
    productName: row.productName,
    userId: row.userId ?? undefined,
    author: row.author,
    question: row.question,
    answer: row.answer ?? undefined,
    answeredBy: row.answeredBy ?? undefined,
    status: row.status as ProductQuestionStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createProductQuestion(
  input: Omit<ProductQuestion, "id" | "status" | "createdAt" | "updatedAt" | "answer" | "answeredBy">
): Promise<ProductQuestion> {
  const now = new Date().toISOString();
  const record: ProductQuestion = {
    id: randomUUID(),
    ...input,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await prisma.productQuestion.create({
    data: {
      id: record.id,
      productId: record.productId,
      productSlug: record.productSlug,
      productName: record.productName,
      userId: record.userId ?? null,
      author: record.author,
      question: record.question,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
  });

  return record;
}

export async function getProductQuestionById(
  id: string
): Promise<ProductQuestion | null> {
  const row = await prisma.productQuestion.findUnique({ where: { id } });
  return row ? mapQuestion(row) : null;
}

export async function listApprovedQuestionsForProduct(
  productId: string
): Promise<ProductQuestionListResponse> {
  const rows = await prisma.productQuestion.findMany({
    where: { productId, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  const questions = rows.map(mapQuestion);
  return { questions, totalCount: questions.length };
}

export async function listProductQuestionsForAdmin(options: {
  status?: ProductQuestionStatus;
  productId?: string;
  limit?: number;
} = {}): Promise<ProductQuestion[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const rows = await prisma.productQuestion.findMany({
    where: {
      ...(options.productId ? { productId: options.productId } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapQuestion);
}

export async function updateProductQuestion(
  id: string,
  patch: Partial<
    Pick<ProductQuestion, "status" | "answer" | "answeredBy" | "question">
  >
): Promise<ProductQuestion> {
  const now = new Date().toISOString();
  await prisma.productQuestion.update({
    where: { id },
    data: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.answer !== undefined ? { answer: patch.answer ?? null } : {}),
      ...(patch.answeredBy !== undefined
        ? { answeredBy: patch.answeredBy ?? null }
        : {}),
      ...(patch.question !== undefined ? { question: patch.question } : {}),
      updatedAt: now,
    },
  });
  const updated = await getProductQuestionById(id);
  if (!updated) throw new Error("Question not found after update");
  return updated;
}
