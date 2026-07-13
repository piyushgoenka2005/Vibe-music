import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listContactMessages } from "@/lib/server/contactRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam === "new" || statusParam === "read" ? statusParam : undefined;
    const messages = await listContactMessages({
      status,
      limit: Number(searchParams.get("limit") ?? 50),
    });
    return NextResponse.json({ messages });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
