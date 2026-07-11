import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { sendContactFormAdminNotification } from "@/lib/server/adminNotificationEmailService";
import { createContactMessage } from "@/lib/server/contactRepository";
import { createAdminNotification } from "@/lib/server/notificationRepository";
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
  const rateLimited = await enforceRateLimit(
    request,
    "contact-form",
    RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  const csrfError = enforceMutationSecurity(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, contactSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const record = await createContactMessage(parsed.data);
    void sendContactFormAdminNotification(parsed.data);
    void createAdminNotification({
      type: "contact",
      title: "New contact message",
      body: `${parsed.data.name}: ${parsed.data.subject}`,
      link: ROUTES.adminSupport,
    });

    return NextResponse.json({
      ok: true,
      id: record.id,
      message: "Thanks for reaching out. Our team will respond within 1–2 business days.",
    });
  } catch (error) {
    console.error("[contact]", error);
    return jsonError("Unable to send your message right now. Please try again.", 500);
  }
}
