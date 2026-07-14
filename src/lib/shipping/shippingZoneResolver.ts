import type { ShippingMethod } from "@/lib/shipping/shippingMethods";
import { SHIPPING_METHODS } from "@/lib/shipping/shippingMethods";
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
  _method: ShippingMethod,
  _subtotal: number,
  _discount: number,
  _zone: ShippingZone | null,
  _defaultThreshold: number
): number {
  // Intentional: storefront policy is free shipping on every order.
  // Admin zone "methodCharges" are informational until this is deliberately re-enabled.
  return 0;
}

export function buildShippingQuotes(
  subtotal: number,
  discount: number,
  zone: ShippingZone | null,
  defaultThreshold: number,
  options?: { standardChargeFallback?: number; methods?: ShippingMethod[] }
): Array<{
  id: ShippingMethod;
  label: string;
  description: string;
  charge: number;
  etaDays: string;
}> {
  const methodIds =
    options?.methods ?? (["standard"] as ShippingMethod[]);

  void subtotal;
  void discount;
  void zone;
  void defaultThreshold;
  void options;

  return methodIds.map((method) => {
    const config = SHIPPING_METHODS[method];
    return {
      ...config,
      charge: 0,
    };
  });
}
