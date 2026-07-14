import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { createGiveawayEntrySchema } from "@/lib/validations/giveaway";
import { submitGiveawayEntry } from "@/lib/server/giveawayEntryService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

function clientIp(request: Request): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "giveaway-entry", RATE_LIMITS.checkout);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const [sessionUser, body] = await Promise.all([
      getSessionUser(),
      request.json(),
    ]);
    const parsed = createGiveawayEntrySchema.parse(body);
    const entry = await submitGiveawayEntry(parsed, {
      userId: sessionUser?.uid,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
      request,
    });

    return NextResponse.json(
      {
        entry: {
          id: entry.id,
          entryNumber: entry.entryNumber,
          referralCode: entry.referralCode,
          totalEntries: entry.totalEntries,
          emailVerified: entry.emailVerified,
          trackingToken: entry.trackingToken,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Entry failed" },
      { status: 400 }
    );
  }
}
