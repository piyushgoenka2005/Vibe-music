import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { buildCompareExportHtml } from "@/lib/compare/compareExportHtml";
import { getCompareShareByToken } from "@/lib/server/compareRepository";
import { trackCompareAction } from "@/lib/server/compareService";
import { getSessionUser } from "@/lib/auth/server-session";
import { fetchProductDetailServer } from "@/lib/server/compareProductLoader";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "compare-export", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const slugsParam = searchParams.get("slugs");

    let slugs: string[] = [];
    if (token) {
      const share = await getCompareShareByToken(token);
      if (!share) {
        return NextResponse.json({ error: "Share not found" }, { status: 404 });
      }
      slugs = share.items.map((i) => i.slug);
    } else if (slugsParam) {
      slugs = slugsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
    }

    if (slugs.length === 0) {
      return NextResponse.json({ error: "No products specified" }, { status: 400 });
    }

    const details = await Promise.all(slugs.map((slug) => fetchProductDetailServer(slug)));
    const items = details
      .filter((d): d is NonNullable<typeof d> => d != null)
      .map((d) => ({
        productId: d.product.id,
        slug: d.product.slug,
        name: d.product.name,
        brand: d.product.brand,
        price: d.product.price,
        image: d.product.image,
        imageColor: d.product.imageColor,
        availability: d.product.availability,
        rating: d.product.rating,
        reviewCount: d.product.reviewCount,
        addedAt: Date.now(),
      }));

    const specsBySlug: Record<string, Array<{ label: string; value: string }>> = {};
    const conditionsBySlug: Record<string, string> = {};
    for (const d of details) {
      if (!d) continue;
      specsBySlug[d.product.slug] = d.product.specs ?? [];
      conditionsBySlug[d.product.slug] = d.product.condition ?? "new";
    }

    const sessionUser = await getSessionUser();
    await trackCompareAction({
      eventType: "export",
      userId: sessionUser?.uid,
      metadata: { slugs, token: token ?? undefined },
    });

    const html = buildCompareExportHtml({ items, specsBySlug, conditionsBySlug });
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return publicApiError(error, "Failed to export compare");
  }
}
