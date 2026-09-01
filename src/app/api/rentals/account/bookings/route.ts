import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getSessionUser } from "@/lib/auth/server-session";
import { listRentalBookingsForUser } from "@/lib/server/rentalRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "rental-bookings", RATE_LIMITS.auth);
    if (rl) return rl;

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const bookings = await listRentalBookingsForUser(user.uid);
    return NextResponse.json({ bookings });
  } catch (error) {
    return publicApiError(error, "Failed to load bookings");
  }
}
