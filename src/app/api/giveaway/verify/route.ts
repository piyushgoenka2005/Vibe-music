import { NextResponse } from "next/server";
import { giveawayVerifySchema } from "@/lib/validations/giveaway";
import { verifyGiveawayEmail } from "@/lib/server/giveawayEntryService";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "giveaway-verify", RATE_LIMITS.auth);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = giveawayVerifySchema.parse(body);
    const entry = await verifyGiveawayEmail(parsed.token);
    return NextResponse.json({ entry, verified: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed", verified: false },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  const rateLimited = await enforceRateLimit(request, "giveaway-verify", RATE_LIMITS.auth);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }
  try {
    const entry = await verifyGiveawayEmail(token);
    return NextResponse.json({ entry, verified: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed", verified: false },
      { status: 400 }
    );
  }
}
