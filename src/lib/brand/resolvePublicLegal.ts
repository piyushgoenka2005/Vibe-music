import "server-only";

import { BRAND } from "@/lib/brand";
import { getStoreSettings } from "@/lib/server/settingsService";
import type { PublicLegalInfo } from "@/types/publicLegal";

/** Footer / invoice legal block — env (build) with live store-settings fallback (L-30). */
export async function resolvePublicLegal(): Promise<PublicLegalInfo> {
  const settings = await getStoreSettings();
  return {
    legalName: settings.storeName?.trim() || BRAND.legalName,
    address: settings.storeAddress?.trim() || BRAND.address,
    gstin: settings.gstNumber?.trim() || BRAND.gstin,
  };
}
