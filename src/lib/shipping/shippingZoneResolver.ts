import type { ShippingMethod } from "@/lib/shipping/shippingMethods";
import { SHIPPING_METHODS } from "@/lib/shipping/shippingMethods";
import type { ShippingZone } from "@/types/shippingZone";

export function matchShippingZone(
  zones: ShippingZone[],
  input: { postalCode?: string; state?: string },
): ShippingZone | null {
  const postalCode = input.postalCode?.trim() ?? "";
  const state = input.state?.trim().toLowerCase() ?? "";

  for (const zone of zones.filter((z) => z.isActive)) {
    if (postalCode && zone.pinCodePrefixes.some((prefix) => postalCode.startsWith(prefix))) {
      return zone;
    }
    if (state && zone.states.some((zoneState) => zoneState.toLowerCase() === state)) {
      return zone;
    }
  }

  return (
    zones.find((zone) => zone.id === "rest-of-india") ?? zones.find((zone) => zone.isActive) ?? null
  );
}

/** Threshold 0 = free shipping on every order (store default policy). */
export function qualifiesForFreeShipping(
  netSubtotal: number,
  freeShippingThreshold: number,
): boolean {
  if (freeShippingThreshold === 0) return true;
  return netSubtotal >= freeShippingThreshold;
}

export function getZoneShippingCharge(
  method: ShippingMethod,
  subtotal: number,
  discount: number,
  zone: ShippingZone | null,
  defaultThreshold: number,
  standardChargeFallback = 0,
): number {
  // Store setting 0 = free shipping on every order (overrides zone thresholds).
  if (defaultThreshold === 0) {
    return 0;
  }

  const netSubtotal = Math.max(0, subtotal - discount);
  const threshold = zone?.freeShippingThreshold ?? defaultThreshold;

  if (qualifiesForFreeShipping(netSubtotal, threshold)) {
    return 0;
  }

  const zoneCharge = zone?.methodCharges?.[method];
  if (zoneCharge != null && zoneCharge >= 0) {
    return zoneCharge;
  }

  return standardChargeFallback;
}

export function buildShippingQuotes(
  subtotal: number,
  discount: number,
  zone: ShippingZone | null,
  defaultThreshold: number,
  options?: { standardChargeFallback?: number; methods?: ShippingMethod[] },
): Array<{
  id: ShippingMethod;
  label: string;
  description: string;
  charge: number;
  etaDays: string;
}> {
  const methodIds = options?.methods ?? (["standard"] as ShippingMethod[]);
  const fallback = options?.standardChargeFallback ?? 0;

  return methodIds.map((method) => {
    const config = SHIPPING_METHODS[method];
    return {
      ...config,
      charge: getZoneShippingCharge(method, subtotal, discount, zone, defaultThreshold, fallback),
    };
  });
}
