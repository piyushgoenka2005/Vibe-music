"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isMetaPixelConfigured } from "@/lib/analytics/metaPixel";
import { relayMetaPageViewCapi, trackMetaPageView } from "@/lib/analytics/metaEvents";

/** SPA PageView events for Meta Pixel + CAPI (initial load + route changes). */
export default function MetaRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isMetaPixelConfigured()) return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (!path) return;

    if (lastPath.current === null) {
      lastPath.current = path;
      relayMetaPageViewCapi(path);
      return;
    }

    if (path === lastPath.current) return;
    lastPath.current = path;

    trackMetaPageView(path);
  }, [pathname, searchParams]);

  return null;
}
