import { NextResponse } from "next/server";
import {
  isDemoPaymentsAllowed,
  isRazorpayConfigured,
} from "@/lib/server/env";
import { getCodCapabilitiesSummary } from "@/lib/server/codEligibility";

export const dynamic = "force-dynamic";

/** Non-secret checkout capability flags for storefront UX. */
export async function GET() {
  const razorpayConfigured = isRazorpayConfigured();
  const demoPaymentsAllowed = isDemoPaymentsAllowed();
  const placesAutocomplete = Boolean(
    process.env.GOOGLE_PLACES_API_KEY?.trim()
  );
  const cod = getCodCapabilitiesSummary();

  return NextResponse.json({
    placesAutocomplete,
    razorpayConfigured,
    demoPaymentsAllowed,
    /** True when Razorpay is live, or demo checkout is allowed without keys. */
    onlinePaymentsAvailable: razorpayConfigured || demoPaymentsAllowed,
    cod,
  });
}
