import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import { saveSubscription } from "@/lib/server/pushService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "push-subscribe",
      RATE_LIMITS.sensitiveAccess
    );
    if (rateLimited) return rateLimited;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = subscribeSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await saveSubscription({
      userId: sessionUser.uid,
      endpoint: body.data.endpoint,
      p256dh: body.data.keys.p256dh,
      auth: body.data.keys.auth,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && /configured/.test(error.message)
            ? "Push notifications are not enabled"
            : "Unable to save subscription",
      },
      { status: error instanceof Error && /configured|Invalid/.test(error.message) ? 400 : 500 }
    );
  }
}
