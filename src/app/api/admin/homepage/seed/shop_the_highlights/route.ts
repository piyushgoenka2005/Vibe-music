import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { seedDefaultShopTheHighlights } from "@/lib/server/homepage/homepageService";

export async function POST(request: Request) {
  try {
    await requireAdmin("homepage:write", request);
    const items = await seedDefaultShopTheHighlights();
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
