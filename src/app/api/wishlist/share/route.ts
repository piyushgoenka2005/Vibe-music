import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { wishlistShareSchema } from "@/lib/validations/wishlist";
import { normalizeWishlistShareItems } from "@/lib/wishlist/normalizeWishlistShareItems";
import { shareWishlist } from "@/lib/server/wishlistShareService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getPublicSiteUrl } from "@/lib/publicSiteUrl";
import { ROUTES } from "@/lib/routes";
import { publicApiError } from "@/lib/server/publicApiError";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "wishlist-share",
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const sessionUser = await getSessionUser();
    const body = await request.json();
    const parsed = wishlistShareSchema.parse(body);
    const items = normalizeWishlistShareItems(parsed.items);
    if (!items.length) {
      return NextResponse.json({ error: "No items to share" }, { status: 400 });
    }

    const share = await shareWishlist({
      items,
      userId: sessionUser?.uid,
    });

    const baseUrl = getPublicSiteUrl();
    return NextResponse.json({
      share: {
        token: share.token,
        url: `${baseUrl}${ROUTES.wishlistShare(share.token)}`,
        expiresAt: share.expiresAt,
      },
    });
  } catch (error) {
    return publicApiError(error, "Share failed");
  }
}
