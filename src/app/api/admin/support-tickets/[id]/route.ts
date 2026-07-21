import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getSupportTicketById,
  updateSupportTicket,
} from "@/lib/server/supportTicketRepository";
import { notifyUserIfAllowed } from "@/lib/server/notificationRepository";
import { sendSupportTicketUpdateEmail } from "@/lib/server/customerUpdateEmailService";
import { adminSupportTicketSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("orders:read");
    const { id } = await context.params;
    const ticket = await getSupportTicketById(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin("orders:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminSupportTicketSchema.parse(body);

    const existing = await getSupportTicketById(id);
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = await updateSupportTicket(id, {
      ...parsed,
      assignedTo: parsed.assignedTo ?? admin.email,
    });

    if (
      parsed.status &&
      parsed.status !== existing.status &&
      (parsed.status === "resolved" || parsed.status === "in_progress")
    ) {
      if (existing.userId) {
        void notifyUserIfAllowed({
          userId: existing.userId,
          type: "support_reply",
          title: "Support ticket update",
          body: `Your ticket "${existing.subject}" is now ${parsed.status.replace("_", " ")}.`,
          link: "/account/notifications",
        });
      }
      void sendSupportTicketUpdateEmail({
        ticket,
        status: parsed.status,
      }).catch(() => undefined);
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
