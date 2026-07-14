import { NextResponse } from "next/server";
import { validateBlogCommentInput } from "@/lib/blog/blogEngine";
import {
  createBlogComment,
  getPublicBlogPostBySlug,
  listApprovedBlogComments,
} from "@/lib/server/blogService";

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
    const { slug } = await context.params;
    const post = await getPublicBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      authorName?: string;
      email?: string;
      body?: string;
      website?: string;
    };
    const validated = validateBlogCommentInput(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const comment = await createBlogComment({
      postId: post.id,
      ...validated,
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
