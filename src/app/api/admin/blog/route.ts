import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { createBlogPost, listAllBlogPosts } from "@/lib/server/blogService";
import { paginateSortedById } from "@/lib/admin/paginateByCursor";
import { adminBlogPostSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("blog:read");
    const { searchParams } = new URL(request.url);
    const posts = await listAllBlogPosts();
    const page = paginateSortedById(posts, {
      limit: Number(searchParams.get("limit") ?? 20),
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({
      posts: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("blog:write", request);
    const body = await request.json();
    const parsed = adminBlogPostSchema.parse(body);
    const post = await createBlogPost({
      ...parsed,
      authorId: admin.uid,
      authorName: admin.displayName || admin.email,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
