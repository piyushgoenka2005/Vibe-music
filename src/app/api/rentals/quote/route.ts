import { NextResponse } from "next/server";
import { rentalQuoteSchema } from "@/lib/validations/rental";
import { quoteRentalItem } from "@/lib/server/rentalBookingService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "rental-quote", RATE_LIMITS.checkout);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const parsed = rentalQuoteSchema.parse(body);
    const quote = await quoteRentalItem(parsed);
    return NextResponse.json({ quote });
  } catch (error) {
    return publicApiError(error, "Quote failed");
  }
}
