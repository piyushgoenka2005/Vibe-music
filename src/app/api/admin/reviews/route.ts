import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listReviews } from "@/lib/server/reviewService";
import type { ReviewDocument } from "@/types/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("reviews:read");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ReviewDocument["status"] | null;
    const reviews = await listReviews(status ?? undefined);
    return NextResponse.json({ reviews });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
