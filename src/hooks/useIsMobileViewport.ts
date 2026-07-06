"use client";

import { useLayoutEffect, useState } from "react";

const MOBILE_VIEWPORT_QUERY = "(max-width: 767px), (pointer: coarse)";

function readMobileViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(readMobileViewport);

  useLayoutEffect(() => {
    const media = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}
