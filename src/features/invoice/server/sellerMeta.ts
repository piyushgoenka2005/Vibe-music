import "server-only";
import { BRAND } from "@/lib/brand";
import { getStoreSettings } from "@/lib/server/settingsService";
import type { InvoiceSellerMeta } from "@/features/invoice/types";

export async function getInvoiceSellerMeta(): Promise<InvoiceSellerMeta> {
  const settings = await getStoreSettings();

  return {
    storeName: settings.storeName || BRAND.name,
    legalName: settings.storeName || BRAND.name,
    tagline: BRAND.tagline,
    address: settings.storeAddress || BRAND.address,
    email: settings.storeEmail || BRAND.email,
    phone: settings.storePhone || BRAND.phoneDisplay,
    website: BRAND.domain,
    gstin: settings.gstNumber || undefined,
    pan: undefined,
    state: settings.sellerState || "Maharashtra",
    stateCode: "",
  };
}

