import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { cancelRentalBookingSchema } from "@/lib/validations/rental";
import { cancelRentalBooking } from "@/lib/server/rentalBookingService";
import { getRentalBookingById } from "@/lib/server/rentalRepository";
import { enforceMutationSecurity } from "@/lib/api/route-utils";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const { id } = await context.params;
    const booking = await getRentalBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const isOwnerById =
      Boolean(sessionUser?.uid) && booking.userId === sessionUser?.uid;
    // Guest bookings (no userId yet) may be cancelled after login with matching email.
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cancellation failed" },
      { status: 400 }
    );
  }
}
