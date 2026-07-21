"use client";

import { Suspense } from "react";
import AnalyticsRouteTracker from "@/components/analytics/AnalyticsRouteTracker";
import CookieConsentBanner from "@/components/analytics/CookieConsentBanner";

export default function AnalyticsProvider() {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
      </Suspense>
      <CookieConsentBanner />
    </>
  );
}
