import type { CartAnalyticsLine } from "@/lib/analytics/items";

/** Stable Meta event_id for Pixel + CAPI deduplication. */
export function createMetaEventId(prefix: string, key: string): string {
  const normalized = key.replace(/\s+/g, "-").slice(0, 120);
  return `${prefix}-${normalized}`;
}

export function metaPurchaseEventId(orderId: string): string {
  return orderId;
}

export function metaViewContentEventId(productId: string): string {
  return createMetaEventId("viewcontent", productId);
}

export function metaViewListEventId(listName: string, productIds: string[]): string {
  const first = productIds[0] ?? "list";
  return createMetaEventId("viewcontent-list", `${listName}-${first}`);
}

export function metaAddToCartEventId(productId: string, quantity: number): string {
  return createMetaEventId(
    "addtocart",
    `${productId}-${quantity}-${Math.floor(Date.now() / 1000)}`,
  );
}

export function metaCheckoutEventId(lines: CartAnalyticsLine[]): string {
  const key = lines
    .map((line) => `${line.productId}:${line.quantity}`)
    .sort()
    .join("|");
  return createMetaEventId("checkout", key || "empty");
}

export function metaPageViewEventId(path: string): string {
  const minute = Math.floor(Date.now() / 60_000);
  return createMetaEventId("pageview", `${path}-${minute}`);
}

export function readMetaBrowserCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const cookies = document.cookie.split(";").map((part) => part.trim());
  let fbp: string | undefined;
  let fbc: string | undefined;
  for (const cookie of cookies) {
    if (cookie.startsWith("_fbp=")) fbp = cookie.slice(5);
    if (cookie.startsWith("_fbc=")) fbc = cookie.slice(5);
  }
  return { fbp, fbc };
}
