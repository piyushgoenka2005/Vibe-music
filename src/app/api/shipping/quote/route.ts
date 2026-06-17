import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/route-utils";
import {
  getShippingChargeForMethod,
  isShippingMethod,
  SHIPPING_METHOD_IDS,
  SHIPPING_METHODS,
  type ShippingMethod,
} from "@/lib/shipping/shippingMethods";

const quoteSchema = z.object({
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  method: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, quoteSchema);
  if ("error" in parsed) return parsed.error;

  const { subtotal, discount } = parsed.data;
  const method: ShippingMethod =
    parsed.data.method && isShippingMethod(parsed.data.method)
      ? parsed.data.method
      : "standard";

  const charge = getShippingChargeForMethod(method, subtotal, discount);

  return NextResponse.json({
    method,
    charge,
    methods: SHIPPING_METHOD_IDS.map((id) => ({
      ...SHIPPING_METHODS[id],
      charge: getShippingChargeForMethod(id, subtotal, discount),
    })),
  });
}
