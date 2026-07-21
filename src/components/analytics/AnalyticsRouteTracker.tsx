"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isAnalyticsEnabled } from "@/lib/analytics/config";
import { trackPageView } from "@/lib/analytics/gtag";

/** SPA page_view events for GA4 (send_page_view is disabled in gtag config). */
export default function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (!path || path === lastPath.current) return;
    lastPath.current = path;

    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}
