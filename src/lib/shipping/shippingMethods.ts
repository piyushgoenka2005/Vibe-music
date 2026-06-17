import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_CHARGE,
} from "@/lib/gstCalculator";

export type ShippingMethod = "standard" | "express" | "overnight";

export interface ShippingMethodConfig {
  id: ShippingMethod;
  label: string;
  description: string;
  charge: number;
  etaDays: string;
}

export const SHIPPING_METHODS: Record<ShippingMethod, ShippingMethodConfig> = {
  standard: {
    id: "standard",
    label: "Standard",
    description: "Delivered in 5–7 business days",
    charge: STANDARD_SHIPPING_CHARGE,
    etaDays: "5-7",
  },
  express: {
    id: "express",
    label: "Express",
    description: "Delivered in 2–3 business days",
    charge: 199,
    etaDays: "2-3",
  },
  overnight: {
    id: "overnight",
    label: "Overnight",
    description: "Next business day in metro cities",
    charge: 399,
    etaDays: "1",
  },
};

export const SHIPPING_METHOD_IDS = Object.keys(
  SHIPPING_METHODS
) as ShippingMethod[];

export function isShippingMethod(value: string): value is ShippingMethod {
  return SHIPPING_METHOD_IDS.includes(value as ShippingMethod);
}

/**
 * Server-authoritative shipping charge for a method and cart subtotal.
 * Free shipping threshold applies to standard delivery only.
 */
export function getShippingChargeForMethod(
  method: ShippingMethod,
  subtotal: number,
  discount: number
): number {
  const afterDiscount = subtotal - discount;

  if (method === "standard" && afterDiscount >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  return SHIPPING_METHODS[method].charge;
}

export function getDefaultShippingMethod(): ShippingMethod {
  return "standard";
}
