import "server-only";
import { BRAND } from "@/lib/brand";
import { getStoreSettings } from "@/lib/server/settingsService";
import type { InvoiceSellerMeta } from "@/features/invoice/types";

const SELLER_META_TTL_MS = 5 * 60 * 1000;
let cachedSellerMeta: { value: InvoiceSellerMeta; expiresAt: number } | null =
  null;

export async function getInvoiceSellerMeta(): Promise<InvoiceSellerMeta> {
  if (cachedSellerMeta && cachedSellerMeta.expiresAt > Date.now()) {
    return cachedSellerMeta.value;
  }

  const settings = await getStoreSettings();

  const meta: InvoiceSellerMeta = {
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

  cachedSellerMeta = {
    value: meta,
    expiresAt: Date.now() + SELLER_META_TTL_MS,
  };

  return meta;
}

