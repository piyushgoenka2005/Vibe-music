import { NextResponse } from "next/server";
import {
  isDemoPaymentsAllowed,
  isRazorpayConfigured,
} from "@/lib/server/env";
import { getCodCapabilitiesSummary } from "@/lib/server/codEligibility";
import { isGooglePlacesConfigured } from "@/lib/server/googlePlaces";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

/** Non-secret checkout capability flags for storefront UX. */
export async function GET() {
  const razorpayConfigured = isRazorpayConfigured();
  const demoPaymentsAllowed = isDemoPaymentsAllowed();
  const placesAutocomplete = isGooglePlacesConfigured();
  const cod = getCodCapabilitiesSummary();
  const storePhone = BRAND.phoneTel;

  return NextResponse.json({
    placesAutocomplete,
    razorpayConfigured,
    demoPaymentsAllowed,
    /** True when Razorpay is live, or demo checkout is allowed without keys. */
    onlinePaymentsAvailable: razorpayConfigured || demoPaymentsAllowed,
    storePhoneConfigured: Boolean(storePhone),
    storePhoneDisplay: BRAND.phoneDisplay || null,
    storePhoneTel: storePhone || null,
    storeEmail: BRAND.email,
    cod,
  });
}
