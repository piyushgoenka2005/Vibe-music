"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import { ROUTES } from "@/lib/routes";
import "@/styles/culture-typography.css";

/** Desktop dotted scroll quote */
const DESKTOP_WORD_CYCLE = [
  "MUSICIANS",
  "DON'T REMEMBER",
  "PRICES.",
  "THEY",
  "REMEMBER",
  "THE",
  "BRAND.",
] as const;

/** Mobile dotted scroll pattern */
const MOBILE_WORD_CYCLE = [
  "DISCOVER",
  "MUSIC",
  "GEAR",
  "CREATORS",
  "STUDIO",
] as const;

const MOBILE_CYCLE_REPEATS = 4;

export interface CultureTypographySectionProps {
  metadataLabel?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonHref?: string;
  backgroundWords?: readonly string[];
  className?: string;
}

/** Scale long lines so they fit within the viewport without cropping. */
function getWordScale(word: string, isMobile = false): number {
  if (word.length <= 9) return 1;
  const divisor = isMobile ? 12 : 10.5;
  return Math.min(1, divisor / word.length);
}

function BackgroundWords({
  lines,
  lit = false,
  isMobile = false,
}: {
  lines: string[];
  lit?: boolean;
  isMobile?: boolean;
}) {
  return (
    <>
      {lines.map((word, index) => (
        <p
          key={`${word}-${index}${lit ? "-lit" : ""}`}
          className={`culture-typography__word${lit ? " culture-typography__word--lit" : ""}`}
          style={
            { "--word-scale": getWordScale(word, isMobile) } as React.CSSProperties
          }
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
  backgroundWords = DESKTOP_WORD_CYCLE,
  className = "",
}: CultureTypographySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useHydrationSafeReducedMotion();
  const isMobile = useIsMobileViewport();
  const showScrollExperience = !reduceMotion;
  const [scrollShiftPx, setScrollShiftPx] = useState(0);
  const [scrollProgressValue, setScrollProgressValue] = useState(0);

  const desktopQuoteLines = useMemo(
    () => (backgroundWords.length > 0 ? [...backgroundWords] : [...DESKTOP_WORD_CYCLE]),
    [backgroundWords]
  );

  const scrollLines = useMemo(() => {
    if (isMobile) {
      const repeated: string[] = [];
      for (let i = 0; i < MOBILE_CYCLE_REPEATS; i++) {
        repeated.push(...MOBILE_WORD_CYCLE);
      }
      return [...repeated, ...repeated];
    }
    return desktopQuoteLines;
  }, [desktopQuoteLines, isMobile]);

  const displayTitle = isMobile ? title.replace(/\n/g, " ") : title;

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

  useLayoutEffect(() => {
    if (!showScrollExperience || isMobile) {
      const frame = window.requestAnimationFrame(() => setScrollShiftPx(0));
      return () => window.cancelAnimationFrame(frame);
    }

    const track = trackRef.current;
    const sticky = sectionRef.current?.querySelector<HTMLElement>(
      ".culture-typography__sticky"
    );
    if (!track || !sticky) return undefined;

    const update = () => {
      const overflow = Math.max(0, track.scrollHeight - sticky.clientHeight);
      setScrollShiftPx(overflow);
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
  }, [isMobile, showScrollExperience, scrollLines]);

  const backgroundY = useTransform(scrollYProgress, (progress) => {
    if (!showScrollExperience) return 0;
    if (isMobile) return `${-50 * progress}%`;
    return -scrollShiftPx * progress;
  });

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.88, 1],
    reduceMotion ? [1, 1, 1, 1] : [0, 1, 1, 0.9]
  );

  const contentY = useTransform(
    scrollYProgress,
    [0, 0.12],
    reduceMotion ? [0, 0] : [48, 0]
  );

  const hintOpacity = useTransform(
    scrollYProgress,
    [0, 0.03, 0.1, 0.2],
    reduceMotion ? [0, 0, 0, 0] : [0, 1, 1, 0]
  );

  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    if (!showScrollExperience) return undefined;
    return scrollYProgress.on("change", (value) => {
      setScrollProgressValue(Math.round(value * 100));
    });
  }, [scrollYProgress, showScrollExperience]);

  useEffect(() => {
    if (reduceMotion || isMobile) return undefined;

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
    };
  }, [isMobile, reduceMotion, springOpacity, springX, springY]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (reduceMotion || isMobile) return;

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      spotlightX.set(((event.clientX - rect.left) / rect.width) * 100);
      spotlightY.set(((event.clientY - rect.top) / rect.height) * 100);
      spotlightOpacity.set(1);
    },
    [isMobile, reduceMotion, spotlightOpacity, spotlightX, spotlightY]
  );

  const handleMouseLeave = useCallback(() => {
    spotlightOpacity.set(0);
  }, [spotlightOpacity]);

  const scrollTrackStyle = showScrollExperience ? { y: backgroundY } : undefined;

  const mobileScrollRunwayVh = MOBILE_CYCLE_REPEATS * 56;
  const desktopScrollRunwayPx = Math.max(scrollShiftPx, desktopQuoteLines.length * 280);

  const sectionStyle = {
    "--culture-scroll-height": !showScrollExperience
      ? isMobile
        ? "100svh"
        : "130svh"
      : isMobile
        ? `${mobileScrollRunwayVh}vh`
        : `calc(100svh + ${desktopScrollRunwayPx}px)`,
  } as React.CSSProperties;

  const sectionClassName = [
    "culture-typography",
    showScrollExperience ? "culture-typography--scrollable" : "culture-typography--static",
    isMobile ? "culture-typography--mobile-hero" : "culture-typography--desktop-quote",
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
      onMouseLeave={showScrollExperience && !isMobile ? handleMouseLeave : undefined}
      onMouseMove={showScrollExperience && !isMobile ? handleMouseMove : undefined}
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
              <BackgroundWords isMobile={isMobile} lines={scrollLines} />
            </div>
          </motion.div>

          {showScrollExperience && !isMobile ? (
            <motion.div
              className="culture-typography__scroll-track culture-typography__scroll-track--spotlight"
              style={scrollTrackStyle}
            >
              <div className="culture-typography__bg-spotlight">
                <BackgroundWords isMobile={isMobile} lines={scrollLines} lit />
              </div>
            </motion.div>
          ) : null}

          {showScrollExperience && !isMobile ? (
            <div className="culture-typography__spotlight-orb" />
          ) : null}

          <div className="culture-typography__scroll-fade culture-typography__scroll-fade--top" />
          <div className="culture-typography__scroll-fade culture-typography__scroll-fade--bottom" />
        </div>

        <motion.div
          className="culture-typography__content"
          style={
            reduceMotion || isMobile
              ? undefined
              : { opacity: contentOpacity, y: contentY }
          }
        >
          <div className="culture-typography__content-inner">
            <p className="culture-typography__meta">{metadataLabel}</p>

            <h2 id="culture-typography-title" className="culture-typography__title">
              {displayTitle}
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

        {showScrollExperience ? (
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
