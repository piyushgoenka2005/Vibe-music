"use client";

import { isMetaPixelConfigured } from "@/lib/analytics/metaPixel";

export type MetaCapiRelayEventName =
  "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

export interface MetaCapiRelayPayload {
  eventName: MetaCapiRelayEventName;
  eventId: string;
  eventSourceUrl?: string;
  customData?: Record<string, unknown>;
  fbp?: string;
  fbc?: string;
}

/** Fire-and-forget browser → server CAPI relay (deduped via shared event_id). */
export function relayMetaCapiEvent(payload: MetaCapiRelayPayload): void {
  if (!isMetaPixelConfigured()) return;
  try {
    void fetch("/api/analytics/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
