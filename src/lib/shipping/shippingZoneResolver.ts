import type { ShippingMethod } from "@/lib/shipping/shippingMethods";
import {
  getShippingChargeForMethod,
  SHIPPING_METHODS,
} from "@/lib/shipping/shippingMethods";
import type { ShippingZone } from "@/types/shippingZone";

export function matchShippingZone(
  zones: ShippingZone[],
  input: { postalCode?: string; state?: string }
): ShippingZone | null {
  const postalCode = input.postalCode?.trim() ?? "";
  const state = input.state?.trim().toLowerCase() ?? "";

  for (const zone of zones.filter((z) => z.isActive)) {
    if (
      postalCode &&
      zone.pinCodePrefixes.some((prefix) => postalCode.startsWith(prefix))
    ) {
      return zone;
    }
    if (
      state &&
      zone.states.some((zoneState) => zoneState.toLowerCase() === state)
    ) {
      return zone;
    }
  }

  return (
    zones.find((zone) => zone.id === "rest-of-india") ??
    zones.find((zone) => zone.isActive) ??
    null
  );
}

export function getZoneShippingCharge(
  method: ShippingMethod,
  subtotal: number,
  discount: number,
  zone: ShippingZone | null,
  defaultThreshold: number
): number {
  const afterDiscount = subtotal - discount;
  const threshold = zone?.freeShippingThreshold ?? defaultThreshold;

  if (method === "standard" && afterDiscount >= threshold) {
    return 0;
  }

  const zoneCharge = zone?.methodCharges?.[method];
  if (typeof zoneCharge === "number" && zoneCharge >= 0) {
    return zoneCharge;
  }

  return getShippingChargeForMethod(method, subtotal, discount);
}

export function buildShippingQuotes(
  subtotal: number,
  discount: number,
  zone: ShippingZone | null,
  defaultThreshold: number
): Array<{
  id: ShippingMethod;
  label: string;
  description: string;
  charge: number;
  etaDays: string;
}> {
  return (Object.keys(SHIPPING_METHODS) as ShippingMethod[]).map((method) => ({
    ...SHIPPING_METHODS[method],
    charge: getZoneShippingCharge(
      method,
      subtotal,
      discount,
      zone,
      defaultThreshold
    ),
  }));
}
