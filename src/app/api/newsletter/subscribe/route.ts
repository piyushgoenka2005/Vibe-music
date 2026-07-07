import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { sendNewsletterWelcomeEmail } from "@/lib/server/newsletterEmailService";
import { subscribeToNewsletter } from "@/lib/server/newsletterRepository";

const subscribeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  marketing: z.boolean().optional(),
});

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(
    request,
    "newsletter-subscribe",
    RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  const csrfError = enforceMutationSecurity(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, subscribeSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const { created } = await subscribeToNewsletter(parsed.data);

    if (created) {
      void sendNewsletterWelcomeEmail({
        email: parsed.data.email,
        firstName: parsed.data.firstName,
      });
    }

    return NextResponse.json({
      ok: true,
      created,
      message: created
        ? "You're subscribed! We'll email you about new products and deals."
        : "You're already subscribed to Vibe Music updates.",
    });
  } catch (error) {
    console.error("[newsletter/subscribe]", error);
    return jsonError("Unable to subscribe right now. Please try again.", 500);
  }
}
