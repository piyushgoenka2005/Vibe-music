"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import { ROUTES } from "@/lib/routes";
import "@/styles/culture-typography.css";

/**
 * One shared quote cycle for SSR + client (no hydration word-list swap).
 * Long lines are scaled via --word-scale so they never clip edge-to-edge.
 */
const WORD_CYCLE = [
  "MUSICIANS",
  "DON'T REMEMBER",
  "PRICES.",
  "THEY",
  "REMEMBER",
  "THE",
  "BRAND.",
] as const;

/** Exactly two quote cycles on mobile + desktop (no extra loop padding). */
const QUOTE_REPEATS = 2;
/**
 * Max pinned scrub distance in sticky-viewport units.
 * Section ≈ pin + this runway → about two page-scrolls to pass through,
 * while both quote cycles still animate (just faster).
 */
const MAX_SCROLL_RUNWAY_VIEWPORTS = 1;

export interface CultureTypographySectionProps {
  metadataLabel?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonHref?: string;
  backgroundWords?: readonly string[];
  className?: string;
}

/** Scale so ultra-bold lines fit ~full viewport width without clipping. */
function getWordScale(word: string): number {
  // Soft cap — keeps "DON'T REMEMBER" large on mobile while still fitting
  const maxCharsAtFullSize = 12;
  if (word.length <= maxCharsAtFullSize) return 1;
  return Math.min(1, maxCharsAtFullSize / word.length);
}

function BackgroundWords({
  lines,
  lit = false,
}: {
  lines: string[];
  lit?: boolean;
}) {
  return (
    <>
      {lines.map((word, index) => (
        <p
          key={`${word}-${index}${lit ? "-lit" : ""}`}
          className={`culture-typography__word${lit ? " culture-typography__word--lit" : ""}`}
          style={{ "--word-scale": getWordScale(word) } as React.CSSProperties}
        >
          {word}
        </p>
      ))}
    </>
  );
}

export default function CultureTypographySection({
  metadataLabel = "( N°2 )",
  title = "Discover the\ngear, creators\nand stories\nbehind\nmodern\nmusic.",
  subtitle,
  buttonLabel = "Explore Gear",
  buttonHref = ROUTES.search,
  backgroundWords = WORD_CYCLE,
  className = "",
}: CultureTypographySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const isMobile = useIsMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  /** Motion values only drive UI after mount — avoids SSR/client transform flash. */
  const motionReady = isClient && !reduceMotion;

  const [scrollShiftPx, setScrollShiftPx] = useState(0);
  const [stickyPinPx, setStickyPinPx] = useState(0);
  const [scrollProgressValue, setScrollProgressValue] = useState(0);

  const quoteLines = useMemo(
    () => (backgroundWords.length > 0 ? [...backgroundWords] : [...WORD_CYCLE]),
    [backgroundWords]
  );

  /** Stable across SSR + hydration — never branch on isMobile here. */
  const scrollLines = useMemo(() => {
    const repeated: string[] = [];
    for (let i = 0; i < QUOTE_REPEATS; i++) {
      repeated.push(...quoteLines);
    }
    return repeated;
  }, [quoteLines]);

  const spotlightX = useMotionValue(50);
  const spotlightY = useMotionValue(50);
  const spotlightOpacity = useMotionValue(0);
  const springX = useSpring(spotlightX, { stiffness: 170, damping: 24, mass: 0.45 });
  const springY = useSpring(spotlightY, { stiffness: 170, damping: 24, mass: 0.45 });
  const springOpacity = useSpring(spotlightOpacity, {
    stiffness: 220,
    damping: 28,
    mass: 0.35,
  });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /** Measure track overflow in px for both mobile + desktop (one transform unit). */
  useLayoutEffect(() => {
    if (!motionReady) {
      setScrollShiftPx(0);
      setStickyPinPx(0);
      return undefined;
    }

    const track = trackRef.current;
    const sticky = sectionRef.current?.querySelector<HTMLElement>(
      ".culture-typography__sticky"
    );
    if (!track || !sticky) return undefined;

    const update = () => {
      const pin = sticky.clientHeight;
      // Full track overflow (both quote cycles), but never more than ~2 viewports
      // of pinned scrolling — words scrub faster instead of trapping the user.
      const overflow = Math.max(0, track.scrollHeight - pin);
      const maxRunway = Math.max(pin, Math.round(pin * MAX_SCROLL_RUNWAY_VIEWPORTS));
      setStickyPinPx(pin);
      setScrollShiftPx(Math.min(overflow, maxRunway));
    };

    const frame = window.requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(track);
    observer.observe(sticky);
    window.addEventListener("resize", update);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [motionReady, scrollLines]);

  // Always numeric px — never mix % and px (framer-motion glitch source).
  const backgroundY = useTransform(scrollYProgress, (progress) => {
    if (!motionReady || scrollShiftPx <= 0) return 0;
    return -scrollShiftPx * progress;
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.88, 1], [1, 1, 0.9]);
  const contentY = useTransform(scrollYProgress, [0, 0.12], motionReady ? [20, 0] : [0, 0]);
  const hintOpacity = useTransform(
    scrollYProgress,
    [0, 0.03, 0.1, 0.2],
    motionReady ? [0, 1, 1, 0] : [0, 0, 0, 0]
  );
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    if (!motionReady) return undefined;
    return scrollYProgress.on("change", (value) => {
      setScrollProgressValue(Math.round(value * 100));
    });
  }, [scrollYProgress, motionReady]);

  useEffect(() => {
    if (!motionReady || isMobile) return undefined;

    const section = sectionRef.current;
    if (!section) return undefined;

    const syncSpotlight = () => {
      section.style.setProperty("--spotlight-x", `${springX.get()}%`);
      section.style.setProperty("--spotlight-y", `${springY.get()}%`);
      section.style.setProperty("--spotlight-opacity", `${springOpacity.get()}`);
    };

    syncSpotlight();
    const unsubX = springX.on("change", syncSpotlight);
    const unsubY = springY.on("change", syncSpotlight);
    const unsubO = springOpacity.on("change", syncSpotlight);

    return () => {
      unsubX();
      unsubY();
      unsubO();
      section.style.setProperty("--spotlight-opacity", "0");
    };
  }, [isMobile, motionReady, springOpacity, springX, springY]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!motionReady || isMobile) return;

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      spotlightX.set(((event.clientX - rect.left) / rect.width) * 100);
      spotlightY.set(((event.clientY - rect.top) / rect.height) * 100);
      spotlightOpacity.set(1);
    },
    [isMobile, motionReady, spotlightOpacity, spotlightX, spotlightY]
  );

  const handleMouseLeave = useCallback(() => {
    spotlightOpacity.set(0);
  }, [spotlightOpacity]);

  const scrollTrackStyle = motionReady ? { y: backgroundY } : undefined;

  // Keep section runway locked to measured pin + overflow (same on mobile + desktop).
  const sectionStyle = {
    ...(motionReady && scrollShiftPx > 0 && stickyPinPx > 0
      ? {
          "--culture-scroll-height": `${Math.round(stickyPinPx + scrollShiftPx)}px`,
        }
      : null),
  } as React.CSSProperties;

  const sectionClassName = [
    "culture-typography",
    reduceMotion ? "culture-typography--static" : "culture-typography--scrollable",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={sectionRef}
      className={sectionClassName}
      style={sectionStyle}
      aria-labelledby="culture-typography-title"
      data-vibe-section="culture-typography"
      onMouseLeave={motionReady && !isMobile ? handleMouseLeave : undefined}
      onMouseMove={motionReady && !isMobile ? handleMouseMove : undefined}
    >
      <div className="culture-typography__sticky">
        <div className="culture-typography__atmosphere" aria-hidden />
        <div className="culture-typography__noise" aria-hidden />

        <div className="culture-typography__typography-stack" aria-hidden>
          <motion.div
            ref={trackRef}
            className="culture-typography__scroll-track"
            style={scrollTrackStyle}
          >
            <div className="culture-typography__bg">
              <BackgroundWords lines={scrollLines} />
            </div>
          </motion.div>

          {motionReady && !isMobile ? (
            <motion.div
              className="culture-typography__scroll-track culture-typography__scroll-track--spotlight"
              style={scrollTrackStyle}
            >
              <div className="culture-typography__bg-spotlight">
                <BackgroundWords lines={scrollLines} lit />
              </div>
            </motion.div>
          ) : null}

          {motionReady && !isMobile ? (
            <div className="culture-typography__spotlight-orb" />
          ) : null}

          <div className="culture-typography__scroll-fade culture-typography__scroll-fade--top" />
          <div className="culture-typography__scroll-fade culture-typography__scroll-fade--bottom" />
        </div>

        <motion.div
          className="culture-typography__content"
          style={
            motionReady && !isMobile
              ? { opacity: contentOpacity, y: contentY }
              : undefined
          }
        >
          <div className="culture-typography__content-inner">
            <p className="culture-typography__meta">{metadataLabel}</p>

            <h2 id="culture-typography-title" className="culture-typography__title">
              {title}
            </h2>

            {subtitle ? (
              <p className="culture-typography__subtitle">{subtitle}</p>
            ) : null}

            <div className="culture-typography__cta-wrap">
              <Link href={buttonHref} className="culture-typography__cta">
                {buttonLabel}
                <span className="culture-typography__cta-icon" aria-hidden>
                  <ArrowRight size={18} strokeWidth={2.25} />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        {!reduceMotion ? (
          <>
            {!isMobile ? (
              <motion.div
                className="culture-typography__scroll-hint"
                style={{ opacity: hintOpacity }}
                aria-hidden
              >
                <span className="culture-typography__scroll-hint-label">Scroll</span>
                <ChevronDown
                  className="culture-typography__scroll-hint-icon"
                  size={20}
                  strokeWidth={2.25}
                />
              </motion.div>
            ) : null}

            <div
              className="culture-typography__progress"
              role="progressbar"
              aria-label="Section scroll progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={scrollProgressValue}
            >
              <motion.div
                className="culture-typography__progress-bar"
                style={{ scaleX: progressScaleX }}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
