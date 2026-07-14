import "server-only";

import { randomUUID, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import { normalizeCompareItems } from "@/lib/compare/compareEngine";
import type { CompareAnalyticsSummary, CompareItemRecord, CompareShareRecord } from "@/types/compare";

function now(): string {
  return new Date().toISOString();
}

export async function getCompareListItems(userId: string): Promise<CompareItemRecord[]> {
  const row = await prisma.productCompareList.findUnique({ where: { userId } });
  if (!row) return [];
  return normalizeCompareItems(row.items);
}

export async function upsertCompareListItems(
  userId: string,
  items: CompareItemRecord[]
): Promise<CompareItemRecord[]> {
  const normalized = normalizeCompareItems(items);
  const updatedAt = now();
  await prisma.productCompareList.upsert({
    where: { userId },
    create: {
      userId,
      items: asJsonValue(normalized),
      updatedAt,
    },
    update: {
      items: asJsonValue(normalized),
      updatedAt,
    },
  });
  return normalized;
}

export async function createCompareShare(input: {
  items: CompareItemRecord[];
  userId?: string | null;
  expiresInDays?: number;
}): Promise<CompareShareRecord> {
  const token = randomBytes(16).toString("hex");
  const createdAt = now();
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString()
    : null;
  const items = normalizeCompareItems(input.items);
  const row = await prisma.productCompareShare.create({
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
  return {
    id: row.id,
    token: row.token,
    items,
    userId: row.userId,
    viewCount: row.viewCount,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export async function getCompareShareByToken(token: string): Promise<CompareShareRecord | null> {
  const row = await prisma.productCompareShare.findUnique({ where: { token } });
  if (!row) return null;
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
    return null;
  }
  return {
    id: row.id,
    token: row.token,
    items: normalizeCompareItems(row.items),
    userId: row.userId,
    viewCount: row.viewCount,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export async function incrementCompareShareViews(token: string): Promise<void> {
  await prisma.productCompareShare.updateMany({
    where: { token },
    data: { viewCount: { increment: 1 } },
  });
}

export async function recordCompareEvent(input: {
  eventType: string;
  userId?: string | null;
  productId?: string | null;
  shareToken?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.productCompareEvent.create({
    data: {
      id: randomUUID(),
      eventType: input.eventType,
      userId: input.userId ?? null,
      productId: input.productId ?? null,
      shareToken: input.shareToken ?? null,
      metadata: asJsonValue(input.metadata ?? {}),
      createdAt: now(),
    },
  });
}

export async function getCompareAnalyticsSummary(): Promise<CompareAnalyticsSummary> {
  const events = await prisma.productCompareEvent.findMany({
    select: { eventType: true, productId: true, metadata: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  let adds = 0;
  let removes = 0;
  let shares = 0;
  let exports = 0;
  let shareViews = 0;
  const productCounts = new Map<string, { name: string; count: number }>();

  for (const event of events) {
    if (event.eventType === "add") adds += 1;
    if (event.eventType === "remove") removes += 1;
    if (event.eventType === "share") shares += 1;
    if (event.eventType === "export") exports += 1;
    if (event.eventType === "share_view") shareViews += 1;
    if (event.eventType === "add" && event.productId) {
      const meta = event.metadata as { name?: string };
      const current = productCounts.get(event.productId);
      productCounts.set(event.productId, {
        name: meta?.name ?? event.productId,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  const topProducts = [...productCounts.entries()]
    .map(([productId, data]) => ({ productId, name: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEvents: events.length,
    adds,
    removes,
    shares,
    exports,
    shareViews,
    topProducts,
  };
}
