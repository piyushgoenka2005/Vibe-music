import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getAdminReviewStats } from "@/lib/server/reviewService";

export async function GET() {
  try {
    await requireAdmin("reviews:read");
    const stats = await getAdminReviewStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
