import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getBlogAnalytics } from "@/lib/server/blogService";

export async function GET() {
  try {
    await requireAdmin("blog:read");
    const analytics = await getBlogAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
