import "server-only";

import { randomUUID, timingSafeEqual } from "node:crypto";

import type { Order } from "@/types/order";

export function generateOrderTrackingToken(): string {
  return randomUUID();
}

export function verifyOrderTrackingToken(
  order: Order,
  token: string | undefined | null
): boolean {
  const stored = order.trackingToken?.trim();
  const provided = token?.trim();
  if (!stored || !provided || stored.length !== provided.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(stored), Buffer.from(provided));
  } catch {
    return false;
  }
}

export function isLegacyOrderTrackingDevFallbackEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
