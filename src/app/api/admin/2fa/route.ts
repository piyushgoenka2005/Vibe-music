import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  disableTotp,
  getTotpEnabled,
} from "@/lib/server/adminTotpService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

/** GET → is 2FA currently enabled for the caller? */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin("settings:read", request);
    return NextResponse.json(
      { enabled: await getTotpEnabled(admin.uid) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

/**
 * POST actions:
 *  - { action: "begin" }            → secret + otpauth URL + QR data URL
 *  - { action: "confirm", token }   → verify code, enable 2FA
 *  - { action: "disable", token }   → verify code, remove 2FA
 */
export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "admin-2fa",
      RATE_LIMITS.sensitiveAccess
    );
    if (rateLimited) return rateLimited;

    const admin = await requireAdmin("settings:read", request);
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      token?: string;
    };

    switch (body.action) {
      case "begin": {
        const enrollment = await beginTotpEnrollment({
          uid: admin.uid,
          email: admin.email,
        });
        return NextResponse.json(enrollment);
      }
      case "confirm": {
        if (!body.token) throw new Error("Code required");
        return NextResponse.json(
          await confirmTotpEnrollment({ uid: admin.uid, token: body.token })
        );
      }
      case "disable": {
        if (!body.token) throw new Error("Code required");
        return NextResponse.json(
          await disableTotp({ uid: admin.uid, token: body.token })
        );
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "2FA action failed";
    // User-input problems (invalid code, wrong order of actions) are 400s;
    // everything else falls through to the standard admin error mapping.
    if (/not found|already|first|Invalid|Code required/.test(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return adminErrorResponse(error);
  }
}
