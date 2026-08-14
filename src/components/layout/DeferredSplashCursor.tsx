"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const SplashCursor = dynamic(() => import("@/components/SplashCursor"), {
  ssr: false,
});

type DeferredSplashCursorProps = ComponentProps<typeof SplashCursor>;

function waitForLcp(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timer = window.setTimeout(finish, timeoutMs);

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          window.clearTimeout(timer);
          observer.disconnect();
          finish();
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      window.clearTimeout(timer);
      finish();
    }
  });
}

export default function DeferredSplashCursor(props: DeferredSplashCursorProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const activate = () => {
      if (!cancelled) setReady(true);
    };

    let idleId: number | ReturnType<typeof requestIdleCallback> = 0;

    const scheduleAfterLcp = () => {
      void waitForLcp().then(() => {
        if (cancelled) return;
        if (typeof window.requestIdleCallback === "function") {
          idleId = window.requestIdleCallback(activate, { timeout: 4000 });
        } else {
          idleId = window.setTimeout(activate, 2500);
        }
      });
    };

    const onInteract = () => activate();
    window.addEventListener("pointermove", onInteract, { once: true, passive: true });
    window.addEventListener("touchstart", onInteract, { once: true, passive: true });

    scheduleAfterLcp();

    return () => {
      cancelled = true;
      if (typeof idleId === "number") {
        window.clearTimeout(idleId);
      } else if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      window.removeEventListener("pointermove", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, []);

  if (!ready) return null;
  return <SplashCursor {...props} />;
}
