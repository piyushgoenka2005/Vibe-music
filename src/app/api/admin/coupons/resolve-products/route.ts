import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { MAX_COUPON_PRODUCT_URLS, parseProductSlugFromInput } from "@/lib/coupons/parseProductUrl";
import { getProductBySlug } from "@/services/catalogService";

const bodySchema = z.object({
  urls: z.array(z.string().min(1)).max(MAX_COUPON_PRODUCT_URLS),
});

export async function POST(request: Request) {
  try {
    await requireAdmin("coupons:write", request);
    const body = await request.json();
    const parsed = bodySchema.parse(body);

    const resolved: Array<{ slug: string; id: string; name: string }> = [];
    const notFound: string[] = [];
    const invalid: string[] = [];

    for (const input of parsed.urls) {
      const slug = parseProductSlugFromInput(input);
      if (!slug) {
        invalid.push(input);
        continue;
      }
      if (resolved.some((entry) => entry.slug === slug)) continue;

      const product = await getProductBySlug(slug);
      if (!product) {
        notFound.push(slug);
        continue;
      }

      resolved.push({ slug: product.slug, id: product.id, name: product.name });
      if (resolved.length >= MAX_COUPON_PRODUCT_URLS) break;
    }

    return NextResponse.json({
      products: resolved,
      notFound,
      invalid,
      productIds: resolved.map((entry) => entry.id),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
