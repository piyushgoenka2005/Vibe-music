import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listReviewsForAdmin } from "@/lib/server/reviewService";
import { adminReviewListQuerySchema } from "@/lib/validations/review";

export async function GET(request: Request) {
  try {
    await requireAdmin("reviews:read");
    const { searchParams } = new URL(request.url);
    const parsed = adminReviewListQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      productId: searchParams.get("productId") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      rating: searchParams.get("rating") ?? undefined,
      verified: searchParams.get("verified") ?? undefined,
      hasImages: searchParams.get("hasImages") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 }
      );
    }

    const result = await listReviewsForAdmin(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
