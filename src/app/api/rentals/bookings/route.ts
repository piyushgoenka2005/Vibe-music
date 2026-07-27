import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { createRentalBookingSchema } from "@/lib/validations/rental";
import { createRentalBooking } from "@/lib/server/rentalBookingService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "rental-booking",
      RATE_LIMITS.checkout
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const [sessionUser, body] = await Promise.all([
      getSessionUser(),
      request.json(),
    ]);
    const parsed = createRentalBookingSchema.parse(body);
    const result = await createRentalBooking(parsed, sessionUser?.uid);

    return NextResponse.json(
      {
        booking: result.booking,
        razorpayOrderId: result.razorpayOrderId,
        demoPaymentAllowed: result.demoPaymentAllowed ?? false,
      },
      { status: 201 }
    );
  } catch (error) {
    return publicApiError(error, "Booking failed");
  }
}
