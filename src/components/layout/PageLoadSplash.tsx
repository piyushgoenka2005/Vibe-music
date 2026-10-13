"use client";

import localFont from "next/font/local";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import "@/styles/page-load-splash.css";
import SplashMusicalItems from "@/components/layout/SplashMusicalItems";
import SplashCornerAccents from "@/components/layout/SplashCornerAccents";
import SplashEcommerceBeat from "@/components/layout/SplashEcommerceBeat";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { clearSplashCover as clearSplashCoverDom } from "@/lib/splash/clearSplashCover";
import {
  SPLASH_ACTIVE_CLASS,
  SPLASH_BRAND_EXIT_MS,
  SPLASH_BRAND_HOLD_MS,
  SPLASH_CONTROLLER_ATTR,
  SPLASH_CONTROLLER_READY,
  SPLASH_EXIT_MS,
  SPLASH_ITEMS_PHASE_MS,
  SPLASH_MIN_TOTAL_MS,
  SPLASH_PENDING_CLASS,
  SPLASH_REDUCED_MOTION_HOLD_MS,
  SPLASH_SEEN_KEY,
  SPLASH_TEASER_DELAY_MS,
  SPLASH_WAVE_SETTLE_MS,
  isPageLoadSplashEnabled,
} from "@/lib/splash/pageLoadSplash";

export { SPLASH_ACTIVE_CLASS, SPLASH_PENDING_CLASS, SPLASH_SEEN_KEY, isPageLoadSplashEnabled };

const splashFont = localFont({
  src: "../../lib/fonts/bebas-neue-latin-400.woff2",
  weight: "400",
  display: "swap",
});

const SPLASH_ENABLED = isPageLoadSplashEnabled();

const SPLASH_ITEMS_START_MS = SPLASH_WAVE_SETTLE_MS + SPLASH_BRAND_HOLD_MS + SPLASH_BRAND_EXIT_MS;

function readSplashStartMs(): number {
  if (typeof window === "undefined") return Date.now();
  const boot = (window as Window & { __VIBE_SPLASH_T0?: number }).__VIBE_SPLASH_T0;
  return typeof boot === "number" && boot > 0 ? boot : Date.now();
}

function splashElapsedMs(startMs: number): number {
  return Math.max(0, Date.now() - startMs);
}

function applySplashCatchUp(
  elapsed: number,
  apply: {
    setSettled: (v: boolean) => void;
    setBrandExiting: (v: boolean) => void;
    setShowItems: (v: boolean) => void;
    setShowTeaser: (v: boolean) => void;
  },
) {
  if (elapsed >= SPLASH_WAVE_SETTLE_MS) apply.setSettled(true);
  if (elapsed >= SPLASH_WAVE_SETTLE_MS + SPLASH_BRAND_HOLD_MS) apply.setBrandExiting(true);
  if (elapsed >= SPLASH_ITEMS_START_MS) apply.setShowItems(true);
  if (elapsed >= SPLASH_ITEMS_START_MS + SPLASH_TEASER_DELAY_MS) apply.setShowTeaser(true);
}

export function shouldShowInitialSplash(): boolean {
  if (!SPLASH_ENABLED) return false;
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

function setSplashCoverActive(active: boolean) {
  const root = document.documentElement;
  if (active) {
    root.classList.add(SPLASH_PENDING_CLASS);
    root.classList.add(SPLASH_ACTIVE_CLASS);
  } else {
    clearSplashCoverDom();
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

function SplashMarkup({ settled, brandExiting }: { settled: boolean; brandExiting: boolean }) {
  return (
    <div
      className={[
        "page-load-splash__frame",
        settled ? "page-load-splash__frame--settled" : "",
        brandExiting ? "page-load-splash__frame--exit" : "",
      ]
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
  brandExiting = false,
  showItems = false,
  showTeaser = false,
}: {
  variant?: "initial" | "inline";
  exiting?: boolean;
  settled?: boolean;
  brandExiting?: boolean;
  showItems?: boolean;
  showTeaser?: boolean;
}) {
  const className = [
    "page-load-splash",
    variant === "inline" ? "page-load-splash--inline" : "",
    exiting ? "page-load-splash--exiting" : "",
    showItems ? "page-load-splash--items" : "",
    showTeaser ? "page-load-splash--teaser" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} role="status" aria-live="polite" aria-label="Loading Vibe Music">
      {showItems ? (
        <>
          <SplashCornerAccents />
          <SplashMusicalItems />
          {showTeaser ? <SplashEcommerceBeat /> : null}
        </>
      ) : (
        <SplashMarkup settled={settled} brandExiting={brandExiting} />
      )}
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
  const [brandExiting, setBrandExiting] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finish = (markSeen: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearSplashCoverDom(markSeen);
    onCompleteRef.current?.();
  };

  const skipSplash = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearSplashCoverDom();
  };

  useLayoutEffect(() => {
    if (variant !== "initial") {
      skipSplash();
      return;
    }

    if (!SPLASH_ENABLED) {
      skipSplash();
      return;
    }

    if (!shouldShowInitialSplash()) {
      skipSplash();
      return;
    }

    startedAtRef.current = readSplashStartMs();
    document.documentElement.setAttribute(SPLASH_CONTROLLER_ATTR, SPLASH_CONTROLLER_READY);
    document.getElementById("vibe-boot-splash")?.removeAttribute("hidden");
    setVisible(true);
    setSplashCoverActive(true);
  }, [variant]);

  useEffect(() => {
    if (!visible || finishedRef.current) return;

    let cancelled = false;
    let settleTimer = 0;
    let brandExitTimer = 0;
    let itemsTimer = 0;
    let teaserTimer = 0;
    let phaseEndTimer = 0;
    let minTotalTimer = 0;
    let fadeTimer = 0;

    const startMs = startedAtRef.current;
    const elapsedAtStart = splashElapsedMs(startMs);

    const runFinish = () => {
      if (cancelled || finishedRef.current) return;
      const elapsed = splashElapsedMs(startMs);
      const waitMs = Math.max(0, SPLASH_MIN_TOTAL_MS - elapsed);
      minTotalTimer = window.setTimeout(() => {
        if (cancelled || finishedRef.current) return;
        setExiting(true);
        fadeTimer = window.setTimeout(() => {
          if (!cancelled) {
            finish(true);
            setVisible(false);
          }
        }, SPLASH_EXIT_MS);
      }, waitMs);
    };

    const schedule = (delayMs: number, fn: () => void) => {
      const waitMs = Math.max(0, delayMs - splashElapsedMs(startMs));
      return window.setTimeout(fn, waitMs);
    };

    if (prefersReducedMotion) {
      setSettled(true);
      phaseEndTimer = schedule(SPLASH_REDUCED_MOTION_HOLD_MS, runFinish);
    } else {
      applySplashCatchUp(elapsedAtStart, {
        setSettled,
        setBrandExiting,
        setShowItems,
        setShowTeaser,
      });

      settleTimer = schedule(SPLASH_WAVE_SETTLE_MS, () => setSettled(true));

      brandExitTimer = schedule(SPLASH_WAVE_SETTLE_MS + SPLASH_BRAND_HOLD_MS, () => {
        setBrandExiting(true);
      });

      itemsTimer = schedule(SPLASH_ITEMS_START_MS, () => {
        setShowItems(true);
      });

      teaserTimer = schedule(SPLASH_ITEMS_START_MS + SPLASH_TEASER_DELAY_MS, () => {
        setShowTeaser(true);
      });

      phaseEndTimer = schedule(SPLASH_ITEMS_START_MS + SPLASH_ITEMS_PHASE_MS, runFinish);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(settleTimer);
      window.clearTimeout(brandExitTimer);
      window.clearTimeout(itemsTimer);
      window.clearTimeout(teaserTimer);
      window.clearTimeout(phaseEndTimer);
      window.clearTimeout(minTotalTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [prefersReducedMotion, visible]);

  if (variant === "inline") {
    return <PageLoadSplashScreen variant="inline" settled showItems showTeaser />;
  }

  if (!visible) return null;

  return (
    <PageLoadSplashScreen
      variant="initial"
      exiting={exiting}
      settled={settled}
      brandExiting={brandExiting}
      showItems={showItems}
      showTeaser={showTeaser}
    />
  );
}
