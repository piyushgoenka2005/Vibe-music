import { NextResponse } from "next/server";
import {
  isDemoPaymentsAllowed,
  isRazorpayConfigured,
} from "@/lib/server/env";
import { isGooglePlacesConfigured } from "@/lib/server/googlePlaces";
import { formatIndianPhone } from "@/lib/brand";
import { getStoreSettings } from "@/lib/server/settingsService";

export const dynamic = "force-dynamic";

/** Non-secret checkout capability flags for storefront UX. */
export async function GET() {
  const razorpayConfigured = isRazorpayConfigured();
  const demoPaymentsAllowed = isDemoPaymentsAllowed();
  const placesAutocomplete = isGooglePlacesConfigured();
  const settings = await getStoreSettings();
  const phone = formatIndianPhone(
    process.env.NEXT_PUBLIC_STORE_PHONE?.trim() ||
      process.env.STORE_PHONE?.trim() ||
      settings.storePhone
  );

  return NextResponse.json({
    placesAutocomplete,
    razorpayConfigured,
    demoPaymentsAllowed,
    /** True when Razorpay is live, or demo checkout is allowed without keys. */
    onlinePaymentsAvailable: razorpayConfigured || demoPaymentsAllowed,
    storePhoneConfigured: Boolean(phone.tel),
    storePhoneDisplay: phone.display || null,
    storePhoneTel: phone.tel || null,
    storeEmail: settings.storeEmail,
    paymentMethods: ["razorpay"] as const,
  });
}
