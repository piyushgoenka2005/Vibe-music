import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, parseJsonBody } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { repriceCartLines } from "@/lib/server/cartPricingService";
import { publicApiError } from "@/lib/server/publicApiError";

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
  try {
    const rateLimited = await enforceRateLimit(request, "cart-reprice", RATE_LIMITS.publicApi);
    if (rateLimited) return rateLimited;

    const parsed = await parseJsonBody(request, repriceSchema);
    if ("error" in parsed) return parsed.error;

    const items = await repriceCartLines(parsed.data.items);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.error ? 0 : item.price * item.quantity),
      0
    );

    return NextResponse.json({ items, subtotal });
  } catch (error) {
    return publicApiError(error, "Failed to reprice cart");
  }
}
