"use client";

import { Bebas_Neue } from "next/font/google";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import "@/styles/page-load-splash.css";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  SPLASH_ACTIVE_CLASS,
  SPLASH_BRAND_HOLD_MS,
  SPLASH_EXIT_MS,
  SPLASH_MIN_TOTAL_MS,
  SPLASH_PENDING_CLASS,
  SPLASH_REDUCED_MOTION_HOLD_MS,
  SPLASH_SEEN_KEY,
  SPLASH_WAVE_SETTLE_MS,
  isPageLoadSplashEnabled,
} from "@/lib/splash/pageLoadSplash";

export { SPLASH_ACTIVE_CLASS, SPLASH_PENDING_CLASS, SPLASH_SEEN_KEY, isPageLoadSplashEnabled };

const splashFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const SPLASH_ENABLED = isPageLoadSplashEnabled();

export function shouldShowInitialSplash(): boolean {
  if (!SPLASH_ENABLED) return false;
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

function clearSplashCover() {
  const root = document.documentElement;
  root.classList.remove(SPLASH_PENDING_CLASS);
  root.classList.remove(SPLASH_ACTIVE_CLASS);
}

function setSplashCoverActive(active: boolean) {
  const root = document.documentElement;
  if (active) {
    root.classList.add(SPLASH_PENDING_CLASS);
    root.classList.add(SPLASH_ACTIVE_CLASS);
  } else {
    clearSplashCover();
  }
}

function markSplashSeen() {
  try {
    sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

interface PageLoadSplashProps {
  variant?: "initial" | "inline";
  onComplete?: () => void;
}

function SplashWaveText({ settled }: { settled: boolean }) {
  const chars = "VIBE MUSIC".split("");

  return (
    <span
      className={`page-load-splash__text ${splashFont.className}${settled ? " page-load-splash__text--settled" : ""}`}
    >
      {chars.map((char, index) => {
        if (char === " ") {
          return <span key={`space-${index}`} className="page-load-splash__space" aria-hidden />;
        }

        const waveBase = Math.sin(index * 0.72) * 0.22;

        return (
          <span
            key={`letter-${index}-${char}`}
            className="page-load-splash__letter"
            style={
              {
                "--wave-i": index,
                "--wave-base": `${waveBase.toFixed(3)}em`,
              } as CSSProperties
            }
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

function SplashMarkup({ settled }: { settled: boolean }) {
  return (
    <div
      className={["page-load-splash__frame", settled ? "page-load-splash__frame--settled" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <SplashWaveText settled={settled} />
    </div>
  );
}

export function PageLoadSplashScreen({
  variant = "initial",
  exiting = false,
  settled = false,
}: {
  variant?: "initial" | "inline";
  exiting?: boolean;
  settled?: boolean;
}) {
  const className = [
    "page-load-splash",
    variant === "inline" ? "page-load-splash--inline" : "",
    exiting ? "page-load-splash--exiting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} role="status" aria-live="polite" aria-label="Loading Vibe Music">
      <SplashMarkup settled={settled} />
    </div>
  );
}

export default function PageLoadSplash({ variant = "initial", onComplete }: PageLoadSplashProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);
  const startedAtRef = useRef(0);

  const [visible, setVisible] = useState(false);
  const [settled, setSettled] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finish = (markSeen: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setVisible(false);
    clearSplashCover();
    if (markSeen) markSplashSeen();
    onCompleteRef.current?.();
  };

  useLayoutEffect(() => {
    if (variant !== "initial") {
      finish(false);
      return;
    }

    if (!SPLASH_ENABLED) {
      finish(false);
      return;
    }

    if (!shouldShowInitialSplash()) {
      finish(false);
      return;
    }

    startedAtRef.current = performance.now();
    setVisible(true);
    setSplashCoverActive(true);
  }, [variant]);

  useEffect(() => {
    if (!visible || finishedRef.current) return;

    let cancelled = false;
    let settleTimer = 0;
    let brandHoldTimer = 0;
    let minTotalTimer = 0;
    let fadeTimer = 0;

    const runFinish = () => {
      if (cancelled || finishedRef.current) return;
      const elapsed = performance.now() - startedAtRef.current;
      const waitMs = Math.max(0, SPLASH_MIN_TOTAL_MS - elapsed);
      minTotalTimer = window.setTimeout(() => {
        if (cancelled || finishedRef.current) return;
        setExiting(true);
        fadeTimer = window.setTimeout(() => {
          if (!cancelled) finish(true);
        }, SPLASH_EXIT_MS);
      }, waitMs);
    };

    if (prefersReducedMotion) {
      setSettled(true);
      brandHoldTimer = window.setTimeout(runFinish, SPLASH_REDUCED_MOTION_HOLD_MS);
    } else {
      settleTimer = window.setTimeout(() => setSettled(true), SPLASH_WAVE_SETTLE_MS);
      brandHoldTimer = window.setTimeout(runFinish, SPLASH_WAVE_SETTLE_MS + SPLASH_BRAND_HOLD_MS);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(settleTimer);
      window.clearTimeout(brandHoldTimer);
      window.clearTimeout(minTotalTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [prefersReducedMotion, visible]);

  if (variant === "inline") {
    return <PageLoadSplashScreen variant="inline" settled />;
  }

  if (!visible) return null;

  return <PageLoadSplashScreen variant="initial" exiting={exiting} settled={settled} />;
}
