import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { reorderNavigationMenuItems } from "@/lib/server/navigation/navigationRepository";
import { z } from "zod";

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number(),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();
    const { items } = reorderSchema.parse(body);
    await reorderNavigationMenuItems(items);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
