import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/route-utils";
import {
  isShippingMethod,
  type ShippingMethod,
} from "@/lib/shipping/shippingMethods";
import { getShippingQuotes } from "@/lib/server/shippingQuoteService";

const quoteSchema = z.object({
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  method: z.string().optional(),
  postalCode: z.string().max(10).optional(),
  state: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, quoteSchema);
  if ("error" in parsed) return parsed.error;

  const method: ShippingMethod =
    parsed.data.method && isShippingMethod(parsed.data.method)
      ? parsed.data.method
      : "standard";

  const quote = await getShippingQuotes({
    subtotal: parsed.data.subtotal,
    discount: parsed.data.discount,
    method,
    postalCode: parsed.data.postalCode,
    state: parsed.data.state,
  });

  return NextResponse.json(quote);
}
