import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteBlogPost,
  getBlogPostById,
  updateBlogPost,
} from "@/lib/server/blogService";
import { adminBlogPostUpdateSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("blog:read");
    const { id } = await context.params;
    const post = await getBlogPostById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("blog:write");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminBlogPostUpdateSchema.parse(body);
    const post = await updateBlogPost(id, parsed);
    return NextResponse.json({ post });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("blog:delete");
    const { id } = await context.params;
    await deleteBlogPost(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
