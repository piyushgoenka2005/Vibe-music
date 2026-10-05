import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listContactMessagesPage } from "@/lib/server/contactRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam === "new" || statusParam === "read" ? statusParam : undefined;
    const page = await listContactMessagesPage({
      status,
      limit: Number(searchParams.get("limit") ?? 20),
      afterCreatedAt: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({
      messages: page.messages,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
