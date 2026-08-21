import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { totpRequiredForEmail } from "@/lib/server/adminTotpService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

/**
 * Login-form pre-check: does this email need a TOTP code?
 * Returns only a boolean — no account-existence oracle beyond what the
 * login error already reveals, and rate-limited like other sensitive reads.
 */
export async function GET(request: Request) {
  const rateLimited = await enforceRateLimit(
    request,
    "totp-status",
    RATE_LIMITS.sensitiveAccess
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim() ?? "";
  const required = await totpRequiredForEmail(email);

  return NextResponse.json(
    { totpRequired: required },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
