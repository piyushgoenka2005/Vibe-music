import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { createContactMessage } from "@/lib/server/contactRepository";
import { createAdminNotification } from "@/lib/server/notificationRepository";
import { subscribeToNewsletter } from "@/lib/server/newsletterRepository";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const notifySchema = z.object({
  email: z.string().email().max(160),
  productId: z.string().min(1).max(120),
  productSlug: z.string().min(1).max(200),
  productName: z.string().min(1).max(240),
  name: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(
    request,
    "product-notify-me",
    RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  const csrfError = enforceMutationSecurity(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, notifySchema);
  if ("error" in parsed) return parsed.error;

  const email = parsed.data.email.trim().toLowerCase();
  const productName = parsed.data.productName.trim();
  const displayName = parsed.data.name?.trim() || "Customer";

  try {
    await createContactMessage({
      name: displayName,
      email,
      subject: `[Notify Me] ${productName}`,
      message: [
        "Customer requested a price / availability alert.",
        `Product: ${productName}`,
        `Product ID: ${parsed.data.productId}`,
        `Product slug: ${parsed.data.productSlug}`,
        `Email: ${email}`,
      ].join("\n"),
    });

    void subscribeToNewsletter({
      email,
      firstName: displayName !== "Customer" ? displayName : undefined,
      marketing: true,
    });

    void createAdminNotification({
      type: "contact",
      title: `Notify me: ${productName}`,
      body: `${email} wants to be notified when this product is available to buy.`,
      link: `/product/${parsed.data.productSlug}`,
    });

    return NextResponse.json({
      ok: true,
      message: "Thanks! We'll email you when this product is available.",
    });
  } catch (error) {
    console.error("[products/notify-me]", error);
    return jsonError("Unable to save your request right now. Please try again.", 500);
  }
}
