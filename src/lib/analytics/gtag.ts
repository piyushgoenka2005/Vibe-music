"use client";

import { getGaMeasurementId } from "@/lib/analytics/config";
import type { Ga4EcommerceParams, Ga4EventName } from "@/lib/analytics/types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(args);
  window.gtag?.(...args);
}

export function grantAnalyticsConsent(): void {
  gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function denyAnalyticsConsent(): void {
  gtag("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function setAnalyticsUserId(userId: string | null): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId || !userId) return;
  gtag("config", measurementId, { user_id: userId });
}

export function trackGaEvent(
  event: Ga4EventName | string,
  params?: Record<string, unknown>
): void {
  gtag("event", event, params ?? {});
}

export function trackGaEcommerce(
  event: Ga4EventName,
  params: Ga4EcommerceParams
): void {
  gtag("event", event, {
    currency: params.currency ?? "INR",
    ...params,
  });
}

export function trackPageView(path: string, title?: string): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId) return;
  gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}
