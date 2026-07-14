import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { updateBlogCommentStatus } from "@/lib/server/blogService";

const schema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin("blog:write", request);
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const comment = await updateBlogCommentStatus(id, body.status);
    return NextResponse.json({ comment });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
