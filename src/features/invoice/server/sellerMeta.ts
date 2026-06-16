import "server-only";
import { getStoreSettings } from "@/lib/server/settingsService";
import type { InvoiceSellerMeta } from "@/features/invoice/types";

export async function getInvoiceSellerMeta(): Promise<InvoiceSellerMeta> {
  const settings = await getStoreSettings();

  const STATE_CODE_MAP: Record<string, string> = {
    Maharashtra: "27",
    "Maharashtra ": "27",
    Gujarat: "24",
    Delhi: "07",
    Karnataka: "29",
    Telangana: "36",
    "Tamil Nadu": "33",
    Kerala: "32",
    "West Bengal": "19",
    "Madhya Pradesh": "23",
    Bihar: "10",
  };

  const stateKey = settings.sellerState?.trim();
  const stateCode =
    (stateKey ? STATE_CODE_MAP[stateKey] : undefined) ??
    (stateKey ? STATE_CODE_MAP[stateKey.replace(/\s+/g, " ")] : undefined) ??
    "";

  return {
    storeName: settings.storeName,
    legalName: settings.storeName,
    tagline: "Your Sound, Delivered",
    address: settings.storeAddress,
    email: settings.storeEmail,
    phone: settings.storePhone,
    website: undefined,
    gstin: settings.gstNumber || undefined,
    pan: undefined,
    state: settings.sellerState,
    stateCode,
  };
}

