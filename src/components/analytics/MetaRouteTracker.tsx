"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isMetaPixelConfigured } from "@/lib/analytics/metaPixel";
import { trackMetaPageView } from "@/lib/analytics/metaEvents";

/** SPA PageView events for Meta Pixel + CAPI (initial load + route changes). */
export default function MetaRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isMetaPixelConfigured()) return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (!path || path === lastPath.current) return;
    lastPath.current = path;

    trackMetaPageView(path);
  }, [pathname, searchParams]);

  return null;
}
