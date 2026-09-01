import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getRentalBookingById } from "@/lib/server/rentalRepository";
import { getSessionUser } from "@/lib/auth/server-session";
import { timingSafeEqual } from "node:crypto";
import { publicApiError } from "@/lib/server/publicApiError";

function verifyToken(stored: string | null | undefined, provided: string | null): boolean {
  const a = stored?.trim();
  const b = provided?.trim();
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await enforceRateLimit(request, "rental-booking-detail", RATE_LIMITS.auth);
    if (rl) return rl;

    const { id } = await context.params;
    const booking = await getRentalBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const isOwner = sessionUser?.uid && booking.userId === sessionUser.uid;
    const isEmailMatch =
      sessionUser?.email &&
      booking.email.toLowerCase() === sessionUser.email.toLowerCase();
    const hasToken = verifyToken(booking.trackingToken, token);

    if (!isOwner && !isEmailMatch && !hasToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return publicApiError(error, "Failed to load booking");
  }
}
