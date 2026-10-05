import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listSupportTicketsPage } from "@/lib/server/supportTicketRepository";
import type { SupportTicketStatus } from "@/types/supportTicket";

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const page = await listSupportTicketsPage({
      status: (searchParams.get("status") as SupportTicketStatus) ?? undefined,
      limit: Number(searchParams.get("limit") ?? 20),
      afterCreatedAt: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({
      tickets: page.tickets,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
