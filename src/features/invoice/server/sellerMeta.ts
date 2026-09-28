import "server-only";
import { BRAND, formatIndianPhone } from "@/lib/brand";
import { REGISTERED_BUSINESS_STATE } from "@/lib/brand/businessIdentity";
import { gstStateCodeFromGstin, panFromGstin } from "@/lib/gst/gstin";
import { getStoreSettings } from "@/lib/server/settingsService";
import type { InvoiceSellerMeta } from "@/features/invoice/types";

const SELLER_META_TTL_MS = 5 * 60 * 1000;
let cachedSellerMeta: { value: InvoiceSellerMeta; expiresAt: number } | null = null;

export async function getInvoiceSellerMeta(): Promise<InvoiceSellerMeta> {
  if (cachedSellerMeta && cachedSellerMeta.expiresAt > Date.now()) {
    return cachedSellerMeta.value;
  }

  const settings = await getStoreSettings();

  const gstin = settings.gstNumber?.trim() || BRAND.gstin || undefined;
  const stateCode = gstStateCodeFromGstin(gstin) || "";

  const meta: InvoiceSellerMeta = {
    storeName: settings.storeName || BRAND.legalName || BRAND.name,
    legalName: BRAND.legalName || settings.storeName || BRAND.name,
    tagline: BRAND.tagline,
    address: settings.storeAddress || BRAND.address,
    email: settings.storeEmail || BRAND.email,
    phone: formatIndianPhone(settings.storePhone || BRAND.phone).display || BRAND.phoneDisplay,
    website: BRAND.domain,
    gstin,
    pan: panFromGstin(gstin),
    state: settings.sellerState || REGISTERED_BUSINESS_STATE,
    stateCode,
  };

  cachedSellerMeta = {
    value: meta,
    expiresAt: Date.now() + SELLER_META_TTL_MS,
  };

  return meta;
}
