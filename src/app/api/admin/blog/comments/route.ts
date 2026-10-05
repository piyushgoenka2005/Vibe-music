import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listBlogCommentsForAdmin } from "@/lib/server/blogService";
import type { BlogCommentStatus } from "@/types/blog";

const VALID_STATUSES = new Set<BlogCommentStatus>(["pending", "approved", "rejected"]);

export async function GET(request: Request) {
  try {
    await requireAdmin("blog:read");
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam && VALID_STATUSES.has(statusParam as BlogCommentStatus)
        ? (statusParam as BlogCommentStatus)
        : undefined;
    const comments = await listBlogCommentsForAdmin(status);
    return NextResponse.json({ comments });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
