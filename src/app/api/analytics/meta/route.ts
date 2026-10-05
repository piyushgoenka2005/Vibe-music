import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { sendMetaCapiEvent, type MetaCapiEventName } from "@/lib/analytics/metaCapi";
import { getClientIp } from "@/lib/security/rate-limit-core";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const metaEventSchema = z.object({
  eventName: z.enum(["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"]),
  eventId: z.string().min(1).max(200),
  eventSourceUrl: z.string().url().optional(),
  customData: z.record(z.string(), z.unknown()).optional(),
  fbp: z.string().optional(),
  fbc: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "meta-capi", RATE_LIMITS.publicApi);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const parsed = metaEventSchema.parse(body);

    await sendMetaCapiEvent({
      eventName: parsed.eventName as MetaCapiEventName,
      eventId: parsed.eventId,
      eventSourceUrl: parsed.eventSourceUrl,
      userData: {
        fbp: parsed.fbp,
        fbc: parsed.fbc,
        clientIpAddress: getClientIp(request),
        clientUserAgent: request.headers.get("user-agent") ?? undefined,
      },
      customData: parsed.customData,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
