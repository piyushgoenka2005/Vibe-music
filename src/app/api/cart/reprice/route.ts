import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/route-utils";
import { repriceCartLines } from "@/lib/server/cartPricingService";

const repriceSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive().max(99),
        name: z.string().optional(),
      })
    )
    .min(1)
    .max(100),
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, repriceSchema);
  if ("error" in parsed) return parsed.error;

  const items = await repriceCartLines(parsed.data.items);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.error ? 0 : item.price * item.quantity),
    0
  );

  return NextResponse.json({ items, subtotal });
}
