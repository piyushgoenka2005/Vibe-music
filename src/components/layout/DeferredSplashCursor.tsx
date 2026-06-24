"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const SplashCursor = dynamic(() => import("@/components/SplashCursor"), {
  ssr: false,
});

type DeferredSplashCursorProps = ComponentProps<typeof SplashCursor>;

export default function DeferredSplashCursor(props: DeferredSplashCursorProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const activate = () => {
      if (!cancelled) setReady(true);
    };

    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(activate, { timeout: 3500 })
        : window.setTimeout(activate, 2000);

    const onInteract = () => activate();
    window.addEventListener("pointermove", onInteract, { once: true, passive: true });
    window.addEventListener("touchstart", onInteract, { once: true, passive: true });

    return () => {
      cancelled = true;
      if (typeof idleId === "number") {
        window.clearTimeout(idleId);
      } else {
        window.cancelIdleCallback(idleId);
      }
      window.removeEventListener("pointermove", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, []);

  if (!ready) return null;
  return <SplashCursor {...props} />;
}
