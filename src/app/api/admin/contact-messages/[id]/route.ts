import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { updateContactMessageStatus } from "@/lib/server/contactRepository";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["new", "read"]),
});

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("orders:write", request);
    const { id } = await context.params;
    const parsed = updateSchema.parse(await request.json());
    const message = await updateContactMessageStatus(id, parsed.status);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    return NextResponse.json({ message });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
