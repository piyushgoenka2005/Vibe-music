import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listProductQuestionsForAdmin } from "@/lib/server/productQuestionRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("reviews:read");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const productId = searchParams.get("productId") ?? undefined;
    const questions = await listProductQuestionsForAdmin({
      status: status as import("@/types/productQuestion").ProductQuestionStatus | undefined,
      productId: productId || undefined,
      limit: 100,
    });
    return NextResponse.json({ questions });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
