import "server-only";

import { unstable_cache } from "next/cache";
import { BRAND } from "@/lib/brand";
import { CANONICAL_BUSINESS_ADDRESS } from "@/lib/brand/businessIdentity";
import * as pgContent from "@/lib/server/prisma/contentRepository";
import type { PublicLegalInfo } from "@/types/publicLegal";

/** Footer / invoice legal block — DB-backed with Next cache (no Upstash in root layout). */
const getPublicLegalFromDb = unstable_cache(
  async (): Promise<PublicLegalInfo> => {
    const settings = await pgContent.getStoreSettings();
    const rawAddress = settings?.storeAddress?.trim() ?? "";
    const storeAddress =
      !rawAddress || /Maharashtra warehouse/i.test(rawAddress)
        ? CANONICAL_BUSINESS_ADDRESS
        : rawAddress;

    return {
      legalName: settings?.storeName?.trim() || BRAND.legalName,
      address: storeAddress || BRAND.address,
      gstin: settings?.gstNumber?.trim() || BRAND.gstin,
    };
  },
  ["public-legal-info-v1"],
  { revalidate: 300, tags: ["store-settings", "public-legal"] },
);

export async function resolvePublicLegal(): Promise<PublicLegalInfo> {
  // Dev default: skip layout-blocking store-settings query (use env/brand fallbacks).
  if (process.env.NODE_ENV === "development" && process.env.DEV_LAYOUT_DB !== "true") {
    return {
      legalName: BRAND.legalName,
      address: BRAND.address,
      gstin: BRAND.gstin,
    };
  }

  try {
    return await getPublicLegalFromDb();
  } catch {
    return {
      legalName: BRAND.legalName,
      address: BRAND.address,
      gstin: BRAND.gstin,
    };
  }
}

export const PUBLIC_LEGAL_CACHE_TAG = "public-legal";
