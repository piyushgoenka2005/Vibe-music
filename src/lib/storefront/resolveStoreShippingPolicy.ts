import "server-only";

import { unstable_cache } from "next/cache";
import { buildShippingPolicyCopy, type ShippingPolicyCopy } from "@/lib/storefront/shippingPolicy";
import { getStoreSettings } from "@/lib/server/settingsService";

const getCachedShippingPolicy = unstable_cache(
  async (): Promise<ShippingPolicyCopy> => {
    const settings = await getStoreSettings();
    return buildShippingPolicyCopy({
      freeShippingThreshold: settings.freeShippingThreshold,
      standardShippingCharge: settings.standardShippingCharge,
    });
  },
  ["store-shipping-policy-v1"],
  { revalidate: 300, tags: ["store-settings"] },
);

export async function resolveStoreShippingPolicy(): Promise<ShippingPolicyCopy> {
  if (process.env.NODE_ENV === "development" && process.env.DEV_LAYOUT_DB !== "true") {
    return buildShippingPolicyCopy({
      freeShippingThreshold: 0,
      standardShippingCharge: 0,
    });
  }

  try {
    return await getCachedShippingPolicy();
  } catch {
    return buildShippingPolicyCopy({
      freeShippingThreshold: 0,
      standardShippingCharge: 0,
    });
  }
}
