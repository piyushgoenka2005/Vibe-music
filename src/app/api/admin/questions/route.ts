import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listProductQuestionsForAdminPage } from "@/lib/server/productQuestionRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("reviews:read");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const productId = searchParams.get("productId") ?? undefined;
    const page = await listProductQuestionsForAdminPage({
      status: status as import("@/types/productQuestion").ProductQuestionStatus | undefined,
      productId: productId || undefined,
      limit: Number(searchParams.get("limit") ?? 20),
      afterCreatedAt: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({
      questions: page.questions,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
