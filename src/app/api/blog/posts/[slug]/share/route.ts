import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicBlogPostBySlug, recordBlogShare } from "@/lib/server/blogService";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

type RouteContext = { params: Promise<{ slug: string }> };

const blogShareSchema = z.object({
  channel: z.string().trim().min(1).max(64).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const rateLimited = await enforceRateLimit(
    request,
    "blog-share",
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

  const raw = await request.json().catch(() => ({}));
  const parsed = blogShareSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const channel = parsed.data.channel?.trim() || "unknown";
  await recordBlogShare(post.id, channel);
  return NextResponse.json({ ok: true });
}
