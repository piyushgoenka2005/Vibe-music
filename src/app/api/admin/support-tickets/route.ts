import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listSupportTickets } from "@/lib/server/supportTicketRepository";
import type { SupportTicketStatus } from "@/types/supportTicket";

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const tickets = await listSupportTickets({
      status: (searchParams.get("status") as SupportTicketStatus) ?? undefined,
      limit: Number(searchParams.get("limit") ?? 50),
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
