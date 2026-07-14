import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { trackCompareAction } from "@/lib/server/compareService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { z } from "zod";

const compareEventSchema = z.object({
  eventType: z.enum(["add", "remove", "export", "clear"]),
  productId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "compare-event", RATE_LIMITS.publicApi);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const sessionUser = await getSessionUser();
    const body = await request.json();
    const parsed = compareEventSchema.parse(body);
    await trackCompareAction({
      eventType: parsed.eventType,
      userId: sessionUser?.uid,
      productId: parsed.productId,
      metadata: parsed.metadata,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
