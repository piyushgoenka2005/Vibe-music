import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { enforceRateLimit, jsonError, parseJsonBody } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import * as pgUsers from "@/lib/server/prisma/usersRepository";
import { accountWishlistPutSchema } from "@/lib/validations/checkout";
import { publicApiError } from "@/lib/server/publicApiError";

export interface WishlistItemRecord {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  imageColor: string;
  image: string;
  addedAt: number;
}

function normalizeItems(
  raw: Array<{
    productId: string;
    slug: string;
    name: string;
    brand: string;
    price: number;
    imageColor: string;
    image: string;
    addedAt?: number;
  }>
): WishlistItemRecord[] {
  return raw.map((item) => ({
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    price: item.price,
    imageColor: item.imageColor,
    image: item.image,
    addedAt: item.addedAt ?? Date.now(),
  }));
}

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "account-wishlist", RATE_LIMITS.publicApi);
    if (rl) return rl;
    const user = await getSessionUser();
    if (!user) return jsonError("Authentication required", 401);
    const items = (await pgUsers.getWishlistItems(user.uid)) as WishlistItemRecord[];
    return NextResponse.json({
      items: Array.isArray(items) ? items.filter((item) => item && typeof item.productId === "string") : [],
    });
  } catch (error) {
    return publicApiError(error, "Failed to load wishlist");
  }
}

export async function PUT(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "account-wishlist", RATE_LIMITS.auth);
    if (rl) return rl;
    const user = await getSessionUser();
    if (!user) return jsonError("Authentication required", 401);
    const parsed = await parseJsonBody(request, accountWishlistPutSchema);
    if ("error" in parsed) return parsed.error;
    const items = normalizeItems(parsed.data.items);
    await pgUsers.upsertWishlistItems(user.uid, items);
    return NextResponse.json({ items });
  } catch (error) {
    return publicApiError(error, "Failed to update wishlist");
  }
}
