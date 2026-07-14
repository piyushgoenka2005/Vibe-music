import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { compareShareSchema } from "@/lib/validations/compare";
import { normalizeCompareItems } from "@/lib/compare/compareEngine";
import { shareCompareList } from "@/lib/server/compareService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getPublicSiteUrl } from "@/lib/publicSiteUrl";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "compare-share", RATE_LIMITS.publicApi);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const sessionUser = await getSessionUser();
    const body = await request.json();
    const parsed = compareShareSchema.parse(body);
    if (!parsed.items?.length) {
      return NextResponse.json({ error: "No items to share" }, { status: 400 });
    }

    const share = await shareCompareList({
      items: normalizeCompareItems(parsed.items),
      userId: sessionUser?.uid,
    });

    const baseUrl = getPublicSiteUrl();
    return NextResponse.json({
      share: {
        token: share.token,
        url: `${baseUrl}/compare/share/${share.token}`,
        expiresAt: share.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Share failed" },
      { status: 400 }
    );
  }
}
