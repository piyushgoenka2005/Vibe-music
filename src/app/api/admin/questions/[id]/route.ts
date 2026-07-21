import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getProductQuestionById,
  updateProductQuestion,
} from "@/lib/server/productQuestionRepository";
import { notifyUserIfAllowed } from "@/lib/server/notificationRepository";
import { sendProductQuestionAnswerEmail } from "@/lib/server/customerUpdateEmailService";
import { adminProductQuestionSchema } from "@/lib/validations/wrFeatures";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("reviews:read");
    const { id } = await context.params;
    const question = await getProductQuestionById(id);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json({ question });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin("reviews:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminProductQuestionSchema.parse(body);

    const existing = await getProductQuestionById(id);
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const patch: Parameters<typeof updateProductQuestion>[1] = {};
    if (parsed.status) patch.status = parsed.status;
    if (parsed.answer !== undefined) {
      patch.answer = parsed.answer;
      patch.answeredBy = admin.email;
      if (!parsed.status) {
        patch.status = parsed.answer.trim() ? "approved" : "pending";
      }
    }

    const question = await updateProductQuestion(id, patch);

    if (
      existing.userId &&
      parsed.answer?.trim() &&
      parsed.answer !== existing.answer
    ) {
      void notifyUserIfAllowed({
        userId: existing.userId,
        type: "product_alert",
        title: "Your product question was answered",
        body: `${existing.productName}: ${parsed.answer.slice(0, 120)}`,
        link: `/product/${existing.productSlug}`,
      });

      void prisma.user
        .findUnique({
          where: { id: existing.userId },
          select: { email: true },
        })
        .then((user) => {
          if (!user?.email) return;
          return sendProductQuestionAnswerEmail({
            email: user.email,
            productName: existing.productName,
            productSlug: existing.productSlug,
            question: existing.question,
            answer: parsed.answer!,
          });
        })
        .catch(() => undefined);
    }

    return NextResponse.json({ question });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
