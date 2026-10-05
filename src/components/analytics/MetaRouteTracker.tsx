"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isMetaPixelConfigured } from "@/lib/analytics/metaPixel";
import { trackMetaPageView } from "@/lib/analytics/metaEvents";

/** SPA PageView events for Meta Pixel (initial PageView fires in MetaPixelScripts). */
export default function MetaRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isMetaPixelConfigured()) return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (!path) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastPath.current = path;
      return;
    }

    if (path === lastPath.current) return;
    lastPath.current = path;
    trackMetaPageView();
  }, [pathname, searchParams]);

  return null;
}
