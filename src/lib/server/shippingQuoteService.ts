import "server-only";

import {
  buildShippingQuotes,
  matchShippingZone,
} from "@/lib/shipping/shippingZoneResolver";
import {
  getDefaultShippingMethod,
  type ShippingMethod,
} from "@/lib/shipping/shippingMethods";
import { listShippingZones } from "@/lib/server/shippingZoneRepository";
import { getStoreSettings } from "@/lib/server/settingsService";

export interface ShippingQuoteInput {
  subtotal: number;
  discount?: number;
  method?: ShippingMethod;
  postalCode?: string;
  state?: string;
}

export async function getShippingQuotes(input: ShippingQuoteInput) {
  const discount = input.discount ?? 0;
  const method = input.method ?? getDefaultShippingMethod();
  const [zones, settings] = await Promise.all([
    listShippingZones(),
    getStoreSettings(),
  ]);
  const zone = matchShippingZone(zones, {
    postalCode: input.postalCode,
    state: input.state,
  });
  const methods = buildShippingQuotes(
    input.subtotal,
    discount,
    zone,
    settings.freeShippingThreshold
  );
  const selected = methods.find((item) => item.id === method) ?? methods[0];

  return {
    method: selected.id,
    charge: selected.charge,
    zone: zone ? { id: zone.id, name: zone.name } : null,
    methods,
  };
}

export async function resolveAuthoritativeShippingCharge(input: {
  method: ShippingMethod;
  subtotal: number;
  discount: number;
  postalCode?: string;
  state?: string;
}): Promise<number> {
  const quote = await getShippingQuotes({
    subtotal: input.subtotal,
    discount: input.discount,
    method: input.method,
    postalCode: input.postalCode,
    state: input.state,
  });
  return quote.charge;
}
