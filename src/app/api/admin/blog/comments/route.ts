import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listBlogCommentsForAdminPage } from "@/lib/server/blogRepository";
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
    const page = await listBlogCommentsForAdminPage({
      status,
      limit: Number(searchParams.get("limit") ?? 20),
      afterCreatedAt: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({
      comments: page.comments,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
