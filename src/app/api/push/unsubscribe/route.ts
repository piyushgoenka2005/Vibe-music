import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { removeSubscription } from "@/lib/server/pushService";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "push-unsubscribe", RATE_LIMITS.auth);
    if (rateLimited) return rateLimited;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
    if (!body.endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }

    await removeSubscription(sessionUser.uid, body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return publicApiError(error, "Failed to unsubscribe");
  }
}
