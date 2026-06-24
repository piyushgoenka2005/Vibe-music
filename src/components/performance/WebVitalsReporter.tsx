"use client";

import { useReportWebVitals } from "next/web-vitals";

const VITALS_ENDPOINT =
  process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT ?? "/api/vitals";

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Vital]", metric);
      return;
    }

    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });

    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(VITALS_ENDPOINT, body);
      return;
    }

    void fetch(VITALS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  });

  return null;
}
