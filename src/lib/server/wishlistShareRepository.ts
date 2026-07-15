import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import { normalizeWishlistShareItems } from "@/lib/wishlist/normalizeWishlistShareItems";
import type { WishlistShareItem, WishlistShareRecord } from "@/types/wishlist";

function now(): string {
  return new Date().toISOString();
}

function toRecord(row: {
  id: string;
  token: string;
  items: unknown;
  userId: string | null;
  viewCount: number;
  createdAt: string;
  expiresAt: string | null;
}): WishlistShareRecord {
  return {
    id: row.id,
    token: row.token,
    items: normalizeWishlistShareItems(row.items),
    userId: row.userId,
    viewCount: row.viewCount,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export async function createWishlistShare(input: {
  items: WishlistShareItem[];
  userId?: string | null;
  expiresInDays?: number;
}): Promise<WishlistShareRecord> {
  const token = randomBytes(16).toString("hex");
  const createdAt = now();
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString()
    : null;
  const items = normalizeWishlistShareItems(input.items);
  const row = await prisma.wishlistShare.create({
    data: {
      id: randomUUID(),
      token,
      items: asJsonValue(items),
      userId: input.userId ?? null,
      viewCount: 0,
      createdAt,
      expiresAt,
    },
  });
  return toRecord(row);
}

export async function getWishlistShareByToken(
  token: string
): Promise<WishlistShareRecord | null> {
  const row = await prisma.wishlistShare.findUnique({ where: { token } });
  if (!row) return null;
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
    return null;
  }
  return toRecord(row);
}

export async function incrementWishlistShareViews(token: string): Promise<void> {
  await prisma.wishlistShare.updateMany({
    where: { token },
    data: { viewCount: { increment: 1 } },
  });
}
