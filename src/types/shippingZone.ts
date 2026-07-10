import type { ShippingMethod } from "@/lib/shipping/shippingMethods";

export interface ShippingZoneMethodCharge {
  standard?: number;
  express?: number;
  overnight?: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  states: string[];
  pinCodePrefixes: string[];
  methodCharges: ShippingZoneMethodCharge;
  freeShippingThreshold?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingZoneMatch {
  zone: ShippingZone | null;
  methodCharges: Partial<Record<ShippingMethod, number>>;
}
