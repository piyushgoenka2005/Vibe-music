"use client";

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

export function trackMetaPageView(): void {
  if (!canTrackMeta()) return;
  fbq("track", "PageView");
}

export function trackMetaViewContent(product: Product): void {
  if (!canTrackMeta()) return;
  fbq("track", "ViewContent", {
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
  fbq("track", "ViewContent", {
    content_name: listName,
    content_ids: products.slice(0, 30).map((product) => product.id),
    content_type: "product",
    currency: "INR",
  });
}

export function trackMetaAddToCart(product: Product, quantity: number): void {
  if (!canTrackMeta()) return;
  fbq("track", "AddToCart", {
    content_name: product.name,
    content_ids: [product.id],
    content_type: "product",
    value: product.price * quantity,
    currency: "INR",
  });
}

export function trackMetaPurchase(order: Order): void {
  if (!canTrackMeta()) return;
  fbq("track", "Purchase", {
    value: order.total,
    currency: "INR",
    content_ids: order.items.map((item) => item.productId),
    content_type: "product",
    num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
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
