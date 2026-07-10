import { NextResponse } from "next/server";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import { createSupportTicketSchema } from "@/lib/validations/wrFeatures";
import { createAdminNotification } from "@/lib/server/notificationRepository";
import { createSupportTicket } from "@/lib/server/supportTicketRepository";
import { ROUTES } from "@/lib/routes";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(
    request,
    "support-ticket",
    RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  const csrfError = enforceMutationSecurity(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, createSupportTicketSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const sessionUser = await getSessionUser();
    const ticket = await createSupportTicket({
      userId: sessionUser?.uid,
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name.trim(),
      subject: parsed.data.subject.trim(),
      message: parsed.data.message.trim(),
      category: parsed.data.category,
      orderId: parsed.data.orderId,
    });

    void createAdminNotification({
      type: "ticket",
      title: "New support ticket",
      body: `${ticket.name}: ${ticket.subject}`,
      link: ROUTES.adminSupport,
    });

    if (sessionUser?.uid) {
      const { notifyUserIfAllowed } = await import(
        "@/lib/server/notificationRepository"
      );
      void notifyUserIfAllowed({
        userId: sessionUser.uid,
        type: "system",
        title: "Support ticket received",
        body: `We received your request: ${ticket.subject}`,
        link: ROUTES.accountSupport,
      });
    }

    return NextResponse.json({
      ok: true,
      id: ticket.id,
      message: "Your support ticket has been submitted. We will respond within 1–2 business days.",
    });
  } catch (error) {
    console.error("[support-tickets]", error);
    return jsonError("Unable to submit your ticket right now. Please try again.", 500);
  }
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { listSupportTickets } = await import(
      "@/lib/server/supportTicketRepository"
    );
    const tickets = await listSupportTickets({
      userId: sessionUser.uid,
      email: sessionUser.email ?? undefined,
      limit: 50,
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("[support-tickets]", error);
    return jsonError("Unable to load tickets.", 500);
  }
}
