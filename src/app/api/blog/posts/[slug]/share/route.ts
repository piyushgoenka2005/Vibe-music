import { NextResponse } from "next/server";
import { getPublicBlogPostBySlug, recordBlogShare } from "@/lib/server/blogService";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const post = await getPublicBlogPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { channel?: string };
  const channel = body.channel?.trim() || "unknown";
  await recordBlogShare(post.id, channel);
  return NextResponse.json({ ok: true });
}
