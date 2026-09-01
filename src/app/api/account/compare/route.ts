import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { jsonError } from "@/lib/api/route-utils";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { compareListSchema } from "@/lib/validations/compare";
import { normalizeCompareItems } from "@/lib/compare/compareEngine";
import { getCompareListItems, upsertCompareListItems } from "@/lib/server/compareRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "account-compare", RATE_LIMITS.publicApi);
    if (rl) return rl;
    const user = await getSessionUser();
    if (!user) return jsonError("Authentication required", 401);
    const items = await getCompareListItems(user.uid);
    return NextResponse.json({ items });
  } catch (error) {
    return publicApiError(error, "Failed to load compare list");
  }
}

export async function PUT(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "account-compare", RATE_LIMITS.auth);
    if (rl) return rl;
    const user = await getSessionUser();
    if (!user) return jsonError("Authentication required", 401);
    const body = await request.json();
    const parsed = compareListSchema.parse(body);
    const items = await upsertCompareListItems(user.uid, normalizeCompareItems(parsed.items));
    return NextResponse.json({ items });
  } catch (error) {
    return publicApiError(error, "Failed to update compare list");
  }
}
