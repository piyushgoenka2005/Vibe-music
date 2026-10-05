"use client";

import type { CartAnalyticsLine } from "@/lib/analytics/items";
import {
  metaAddToCartEventId,
  metaCheckoutEventId,
  metaPageViewEventId,
  metaPurchaseEventId,
  metaViewContentEventId,
  metaViewListEventId,
  readMetaBrowserCookies,
} from "@/lib/analytics/metaEventId";
import { relayMetaCapiEvent } from "@/lib/analytics/metaCapiRelay";
import { isMetaPixelConfigured } from "@/lib/analytics/metaPixel";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]): void {
  if (typeof window === "undefined" || !isMetaPixelConfigured()) return;
  window.fbq?.(...args);
}

function canTrackMeta(): boolean {
  return typeof window !== "undefined" && isMetaPixelConfigured();
}

function trackWithDedup(
  eventName: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase",
  eventId: string,
  customData: Record<string, unknown>,
): void {
  if (!canTrackMeta()) return;
  const { fbp, fbc } = readMetaBrowserCookies();
  fbq("track", eventName, customData, { eventID: eventId });
  relayMetaCapiEvent({
    eventName,
    eventId,
    eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
    customData,
    fbp,
    fbc,
  });
}

export function trackMetaPageView(path?: string): void {
  if (!canTrackMeta()) return;
  const pathname = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const eventId = metaPageViewEventId(pathname);
  trackWithDedup("PageView", eventId, {});
}

export function trackMetaViewContent(product: Product): void {
  const eventId = metaViewContentEventId(product.id);
  trackWithDedup("ViewContent", eventId, {
    content_name: product.name,
    content_category: product.category,
    content_ids: [product.id],
    content_type: "product",
    value: product.price,
    currency: "INR",
  });
}

export function trackMetaViewItemList(listName: string, products: Product[]): void {
  if (!canTrackMeta() || products.length === 0) return;
  const ids = products.slice(0, 30).map((product) => product.id);
  const eventId = metaViewListEventId(listName, ids);
  trackWithDedup("ViewContent", eventId, {
    content_name: listName,
    content_ids: ids,
    content_type: "product",
    currency: "INR",
  });
}

export function trackMetaAddToCart(product: Product, quantity: number): void {
  const eventId = metaAddToCartEventId(product.id, quantity);
  trackWithDedup("AddToCart", eventId, {
    content_name: product.name,
    content_ids: [product.id],
    content_type: "product",
    value: product.price * quantity,
    currency: "INR",
  });
}

export function trackMetaInitiateCheckout(lines: CartAnalyticsLine[]): void {
  if (!canTrackMeta() || lines.length === 0) return;
  const eventId = metaCheckoutEventId(lines);
  const value = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  trackWithDedup("InitiateCheckout", eventId, {
    content_ids: lines.map((line) => line.productId),
    content_type: "product",
    value,
    currency: "INR",
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
  });
}

export function trackMetaPurchase(order: Order): void {
  const eventId = metaPurchaseEventId(order.id);
  trackWithDedup("Purchase", eventId, {
    value: order.total,
    currency: "INR",
    content_ids: order.items.map((item) => item.productId),
    content_type: "product",
    num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    order_id: order.id,
  });
}

export function grantMetaConsent(): void {
  if (!canTrackMeta()) return;
  fbq("consent", "grant");
}

export function revokeMetaConsent(): void {
  if (!canTrackMeta()) return;
  fbq("consent", "revoke");
}
