import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { cancelRentalBookingSchema } from "@/lib/validations/rental";
import { cancelRentalBooking } from "@/lib/server/rentalBookingService";
import { getRentalBookingById } from "@/lib/server/rentalRepository";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const rl = await enforceRateLimit(request, "rental-cancel", RATE_LIMITS.checkout);
    if (rl) return rl;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const { id } = await context.params;
    const booking = await getRentalBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const isOwnerById = Boolean(sessionUser?.uid) && booking.userId === sessionUser?.uid;
    const isOwnerByGuestEmail =
      !booking.userId &&
      Boolean(sessionUser?.email) &&
      booking.email.toLowerCase() === sessionUser!.email!.toLowerCase();

    if (!isOwnerById && !isOwnerByGuestEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = cancelRentalBookingSchema.parse(body);
    const updated = await cancelRentalBooking({
      bookingId: id,
      reason: parsed.reason,
      actorId: sessionUser?.uid,
      actorEmail: sessionUser?.email ?? undefined,
      request,
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    return publicApiError(error, "Cancellation failed");
  }
}
