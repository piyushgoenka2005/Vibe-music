import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { jsonError, parseJsonBody } from "@/lib/api/route-utils";
import * as pgUsers from "@/lib/server/prisma/usersRepository";
import { accountWishlistPutSchema } from "@/lib/validations/checkout";

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

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Authentication required", 401);

  const items = (await pgUsers.getWishlistItems(user.uid)) as WishlistItemRecord[];
  return NextResponse.json({
    items: Array.isArray(items)
      ? items.filter((item) => item && typeof item.productId === "string")
      : [],
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Authentication required", 401);

  const parsed = await parseJsonBody(request, accountWishlistPutSchema);
  if ("error" in parsed) return parsed.error;

  const items = normalizeItems(parsed.data.items);
  await pgUsers.upsertWishlistItems(user.uid, items);
  return NextResponse.json({ items });
}
