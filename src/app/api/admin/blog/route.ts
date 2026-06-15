import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { createBlogPost, listAllBlogPosts } from "@/lib/server/blogService";
import { adminBlogPostSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdmin("blog:read");
    const posts = await listAllBlogPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("blog:write");
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
