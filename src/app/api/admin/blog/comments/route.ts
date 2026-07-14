import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listBlogCommentsForAdmin } from "@/lib/server/blogService";

export async function GET() {
  try {
    await requireAdmin("blog:read");
    const comments = await listBlogCommentsForAdmin();
    return NextResponse.json({ comments });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
