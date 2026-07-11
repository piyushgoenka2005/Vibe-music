import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { jsonError } from "@/lib/api/route-utils";
import * as pgUsers from "@/lib/server/prisma/usersRepository";

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

function normalizeItems(raw: unknown): WishlistItemRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is WishlistItemRecord =>
      item != null &&
      typeof item === "object" &&
      typeof (item as WishlistItemRecord).productId === "string"
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Authentication required", 401);

  const items = normalizeItems(await pgUsers.getWishlistItems(user.uid));
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Authentication required", 401);

  const body = (await request.json()) as { items?: WishlistItemRecord[] };
  const items = normalizeItems(body.items);
  await pgUsers.upsertWishlistItems(user.uid, items);
  return NextResponse.json({ items });
}
