import { NextResponse } from "next/server";
import {
  createBlogComment,
  getPublicBlogPostBySlug,
  listApprovedBlogComments,
} from "@/lib/server/blogService";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { blogCommentSchema } from "@/lib/validations/checkout";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const post = await getPublicBlogPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  const comments = await listApprovedBlogComments(post.id);
  return NextResponse.json({
    comments: comments.map(({ id, authorName, body, createdAt }) => ({
      id,
      authorName,
      body,
      createdAt,
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "blog-comment",
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const { slug } = await context.params;
    const post = await getPublicBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const parsed = await parseJsonBody(request, blogCommentSchema);
    if ("error" in parsed) return parsed.error;

    const comment = await createBlogComment({
      postId: post.id,
      authorName: parsed.data.authorName,
      email: parsed.data.email,
      body: parsed.data.body,
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          status: comment.status,
        },
        message: "Thanks! Your comment is awaiting moderation.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[blog/comments]", error);
    return NextResponse.json({ error: "Unable to submit comment" }, { status: 500 });
  }
}
