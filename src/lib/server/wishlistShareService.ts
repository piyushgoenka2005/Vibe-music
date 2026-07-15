import "server-only";

import { normalizeWishlistShareItems } from "@/lib/wishlist/normalizeWishlistShareItems";
import {
  createWishlistShare,
  getWishlistShareByToken,
  incrementWishlistShareViews,
} from "@/lib/server/wishlistShareRepository";
import type { WishlistShareItem } from "@/types/wishlist";

export async function shareWishlist(input: {
  items: WishlistShareItem[];
  userId?: string | null;
}) {
  const items = normalizeWishlistShareItems(input.items);
  if (items.length === 0) {
    throw new Error("Add products before sharing");
  }
  return createWishlistShare({
    items,
    userId: input.userId,
    expiresInDays: 90,
  });
}

export async function loadSharedWishlist(token: string) {
  const share = await getWishlistShareByToken(token);
  if (!share) throw new Error("Shared wishlist not found or expired");
  await incrementWishlistShareViews(token);
  return share;
}
