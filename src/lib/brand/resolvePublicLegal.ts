import "server-only";

import { BRAND } from "@/lib/brand";
import { getStoreSettings } from "@/lib/server/settingsService";
import type { PublicLegalInfo } from "@/types/publicLegal";

/** Footer / invoice legal block — env (build) with live store-settings fallback (L-30). */
export async function resolvePublicLegal(): Promise<PublicLegalInfo> {
  // Dev default: skip layout-blocking store-settings query (use env/brand fallbacks).
  if (process.env.NODE_ENV === "development" && process.env.DEV_LAYOUT_DB !== "true") {
    return {
      legalName: BRAND.legalName,
      address: BRAND.address,
      gstin: BRAND.gstin,
    };
  }

  const settings = await getStoreSettings();
  return {
    legalName: settings.storeName?.trim() || BRAND.legalName,
    address: settings.storeAddress?.trim() || BRAND.address,
    gstin: settings.gstNumber?.trim() || BRAND.gstin,
  };
}
