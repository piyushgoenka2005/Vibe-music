import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { BRAND } from "@/lib/brand";
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

async function notifySupportEmail(input: z.infer<typeof contactSchema>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from =
    process.env.ORDER_EMAIL_FROM ?? `${BRAND.name} <orders@${BRAND.domain}>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [BRAND.email],
      reply_to: input.email,
      subject: `[Contact] ${input.subject}`,
      html: `
        <p><strong>Name:</strong> ${input.name}</p>
        <p><strong>Email:</strong> ${input.email}</p>
        ${input.phone ? `<p><strong>Phone:</strong> ${input.phone}</p>` : ""}
        <p><strong>Subject:</strong> ${input.subject}</p>
        <p>${input.message.replace(/\n/g, "<br/>")}</p>
      `,
    }),
  });
}

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
    void notifySupportEmail(parsed.data);
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
