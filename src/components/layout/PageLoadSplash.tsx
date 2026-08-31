"use client";

import { Bebas_Neue } from "next/font/google";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "@/styles/page-load-splash.css";
import SplashMusicalItems from "@/components/layout/SplashMusicalItems";
import SplashCornerAccents from "@/components/layout/SplashCornerAccents";
import SplashEcommerceBeat from "@/components/layout/SplashEcommerceBeat";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const splashFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/** Framed VIBE MUSIC → musical items → “Entering the store…”. */
const WAVE_SETTLE_MS = 200;
const BRAND_HOLD_MS = 100;
const BRAND_EXIT_MS = 160;
const TEASER_DELAY_MS = 280;
const ITEMS_PHASE_MS = 400;
const FULL_EXIT_MS = 150;
export const SPLASH_SEEN_KEY = "vibe-splash-seen";
export const SPLASH_ACTIVE_CLASS = "vibe-splash-active";
export const SPLASH_PENDING_CLASS = "vibe-splash-pending";

const SPLASH_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH !== "false";

export function isPageLoadSplashEnabled(): boolean {
  return SPLASH_ENABLED;
}

export function shouldShowInitialSplash(): boolean {
  if (!SPLASH_ENABLED) return false;
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

function removeBootSplash() {
  // Never DOM-remove #vibe-boot-splash — React owns that node.
  // Visibility is gated by html.vibe-splash-pending in CSS.
  document.documentElement.classList.remove(SPLASH_PENDING_CLASS);
}

function setSplashCoverActive(active: boolean) {
  const root = document.documentElement;
  if (active) {
    root.classList.add(SPLASH_PENDING_CLASS);
    root.classList.add(SPLASH_ACTIVE_CLASS);
  } else {
    root.classList.remove(SPLASH_PENDING_CLASS);
    root.classList.remove(SPLASH_ACTIVE_CLASS);
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
          return (
            <span
              key={`space-${index}`}
              className="page-load-splash__space"
              aria-hidden
            />
          );
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

function SplashMarkup({
  settled,
  brandExiting,
}: {
  settled: boolean;
  brandExiting: boolean;
}) {
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
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label="Loading Vibe Music"
    >
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

export default function PageLoadSplash({
  variant = "initial",
  onComplete,
}: PageLoadSplashProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);

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
    setVisible(false);
    setSplashCoverActive(false);
    removeBootSplash();
    if (markSeen) markSplashSeen();
    onCompleteRef.current?.();
  };

  useLayoutEffect(() => {
    if (variant !== "initial") {
      finish(false);
      return;
    }

    if (!SPLASH_ENABLED || prefersReducedMotion) {
      finish(prefersReducedMotion);
      return;
    }

    if (!shouldShowInitialSplash()) {
      finish(false);
      return;
    }

    setVisible(true);
    setSplashCoverActive(true);
    removeBootSplash();
  }, [prefersReducedMotion, variant]);

  useEffect(() => {
    if (!visible || prefersReducedMotion || finishedRef.current) return;
    const settleTimer = window.setTimeout(
      () => setSettled(true),
      WAVE_SETTLE_MS
    );
    return () => window.clearTimeout(settleTimer);
  }, [prefersReducedMotion, visible]);

  useEffect(() => {
    if (variant !== "initial" || !visible || finishedRef.current) return;

    let brandExitTimer = 0;
    let itemsTimer = 0;
    let teaserTimer = 0;
    let fullExitTimer = 0;
    let hideTimer = 0;
    let cancelled = false;

    const itemsStart = WAVE_SETTLE_MS + BRAND_HOLD_MS + BRAND_EXIT_MS;

    if (prefersReducedMotion) {
      fullExitTimer = window.setTimeout(() => {
        setExiting(true);
        hideTimer = window.setTimeout(() => {
          if (!cancelled) finish(true);
        }, 140);
      }, 280);
    } else {
      brandExitTimer = window.setTimeout(() => {
        setBrandExiting(true);
      }, WAVE_SETTLE_MS + BRAND_HOLD_MS);

      itemsTimer = window.setTimeout(() => {
        setShowItems(true);
      }, itemsStart);

      teaserTimer = window.setTimeout(() => {
        setShowTeaser(true);
      }, itemsStart + TEASER_DELAY_MS);

      fullExitTimer = window.setTimeout(() => {
        setExiting(true);
        hideTimer = window.setTimeout(() => {
          if (!cancelled) finish(true);
        }, FULL_EXIT_MS);
      }, itemsStart + ITEMS_PHASE_MS);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(brandExitTimer);
      window.clearTimeout(itemsTimer);
      window.clearTimeout(teaserTimer);
      window.clearTimeout(fullExitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [prefersReducedMotion, variant, visible]);

  if (variant === "inline") {
    return (
      <PageLoadSplashScreen variant="inline" settled showItems showTeaser />
    );
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
