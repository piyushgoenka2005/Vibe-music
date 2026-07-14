import "server-only";

import { normalizeCompareItems } from "@/lib/compare/compareEngine";
import {
  createCompareShare,
  getCompareShareByToken,
  incrementCompareShareViews,
  recordCompareEvent,
} from "@/lib/server/compareRepository";
import type { CompareItemRecord } from "@/types/compare";

export async function shareCompareList(input: {
  items: CompareItemRecord[];
  userId?: string | null;
}) {
  const items = normalizeCompareItems(input.items);
  if (items.length === 0) {
    throw new Error("Add products before sharing");
  }
  const share = await createCompareShare({
    items,
    userId: input.userId,
    expiresInDays: 90,
  });
  await recordCompareEvent({
    eventType: "share",
    userId: input.userId,
    metadata: { token: share.token, count: items.length },
  });
  return share;
}

export async function loadSharedCompare(token: string) {
  const share = await getCompareShareByToken(token);
  if (!share) throw new Error("Shared compare not found or expired");
  await incrementCompareShareViews(token);
  await recordCompareEvent({
    eventType: "share_view",
    shareToken: token,
    metadata: { count: share.items.length },
  });
  return share;
}

export async function trackCompareAction(input: {
  eventType: "add" | "remove" | "export" | "clear";
  userId?: string | null;
  productId?: string;
  metadata?: Record<string, unknown>;
}) {
  await recordCompareEvent({
    eventType: input.eventType,
    userId: input.userId,
    productId: input.productId,
    metadata: input.metadata,
  });
}
