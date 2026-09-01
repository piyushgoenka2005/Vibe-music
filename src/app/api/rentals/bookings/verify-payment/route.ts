import { NextResponse } from "next/server";
import { verifyRentalPaymentSchema } from "@/lib/validations/rental";
import { verifyRentalPayment } from "@/lib/server/rentalBookingService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "rental-verify-payment",
      RATE_LIMITS.checkout
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const parsed = verifyRentalPaymentSchema.parse(body);
    const booking = await verifyRentalPayment(parsed);
    return NextResponse.json({ booking });
  } catch (error) {
    return publicApiError(error, "Payment verification failed");
  }
}
