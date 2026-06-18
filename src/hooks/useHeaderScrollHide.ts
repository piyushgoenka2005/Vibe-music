"use client";

import { useEffect, useRef, useState } from "react";

const SCROLL_DELTA_THRESHOLD = 8;
const MIN_SCROLL_Y = 64;

interface UseHeaderScrollHideOptions {
  enabled: boolean;
  paused?: boolean;
}

export function useHeaderScrollHide({
  enabled,
  paused = false,
}: UseHeaderScrollHideOptions) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    lastScrollY.current = window.scrollY;

    const update = () => {
      const currentY = window.scrollY;

      if (paused || currentY <= MIN_SCROLL_Y) {
        setHidden(false);
        lastScrollY.current = currentY;
        ticking.current = false;
        return;
      }

      const delta = currentY - lastScrollY.current;

      if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) {
        ticking.current = false;
        return;
      }

      if (delta > 0) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      lastScrollY.current = currentY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, paused]);

  return enabled ? hidden : false;
}
