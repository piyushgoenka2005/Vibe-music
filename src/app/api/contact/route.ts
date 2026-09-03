import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import { sendContactFormAdminNotification } from "@/lib/server/adminNotificationEmailService";
import { createContactMessage } from "@/lib/server/contactRepository";
import { createAdminNotification, notifyUserIfAllowed } from "@/lib/server/notificationRepository";
import { createSupportTicket } from "@/lib/server/supportTicketRepository";
import { ROUTES } from "@/lib/routes";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.string().min(3).max(160),
  message: z.string().min(10).max(4000),
});

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, "contact-form", RATE_LIMITS.auth);
  if (rateLimited) return rateLimited;

  const csrfError = enforceMutationSecurity(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, contactSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const sessionUser = await getSessionUser();
    const record = await createContactMessage(parsed.data);

    // Also create a support ticket so customer requests submitted via the contact form
    // appear under their account support tickets and are trackable in the support queue.
    const ticket = await createSupportTicket({
      userId: sessionUser?.uid,
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name.trim(),
      subject: parsed.data.subject.trim(),
      message: parsed.data.phone
        ? `${parsed.data.message.trim()}\n\nPhone: ${parsed.data.phone.trim()}`
        : parsed.data.message.trim(),
      category: "other",
    });

    void sendContactFormAdminNotification(parsed.data);
    void createAdminNotification({
      type: "contact",
      title: "New contact message",
      body: `${parsed.data.name}: ${parsed.data.subject}`,
      link: ROUTES.adminSupport,
    });

    if (sessionUser?.uid) {
      void notifyUserIfAllowed({
        userId: sessionUser.uid,
        type: "system",
        title: "Contact request received",
        body: `We received your message: ${parsed.data.subject}`,
        link: ROUTES.accountSupport,
      });
    }

    return NextResponse.json({
      ok: true,
      id: record.id,
      ticketId: ticket.id,
      message: "Thanks for reaching out. Our team will respond within 1–2 business days.",
    });
  } catch (error) {
    console.error("[contact]", error);
    return jsonError("Unable to send your message right now. Please try again.", 500);
  }
}
