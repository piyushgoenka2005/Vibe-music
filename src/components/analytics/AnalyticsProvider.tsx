"use client";

import { Suspense } from "react";
import AnalyticsRouteTracker from "@/components/analytics/AnalyticsRouteTracker";
import MetaRouteTracker from "@/components/analytics/MetaRouteTracker";
import CookieConsentBanner from "@/components/analytics/CookieConsentBanner";

export default function AnalyticsProvider() {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
        <MetaRouteTracker />
      </Suspense>
      <CookieConsentBanner />
    </>
  );
}
