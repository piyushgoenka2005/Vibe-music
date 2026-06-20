"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import { ROUTES } from "@/lib/routes";
import "@/styles/culture-typography.css";

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const DEFAULT_BACKGROUND_WORDS = [
  "DISCOVER",
  "MUSIC",
  "GEAR",
  "DISCOVER",
  "MUSIC",
  "GEAR",
];

export interface CultureTypographySectionProps {
  metadataLabel?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonHref?: string;
  backgroundWords?: readonly string[];
  className?: string;
}

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 56 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.95,
      ease: EASE_PREMIUM,
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE_PREMIUM },
  },
};

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
        >
          {word}
        </p>
      ))}
    </>
  );
}

export default function CultureTypographySection({
  metadataLabel = "( N°2 )",
  title = "Discover the gear, creators and stories behind modern music.",
  subtitle,
  buttonLabel = "Explore Gear",
  buttonHref = ROUTES.search,
  backgroundWords = DEFAULT_BACKGROUND_WORDS,
  className = "",
}: CultureTypographySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useHydrationSafeReducedMotion();

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
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const backgroundScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.02, 1, 0.98]);
  const isInView = useInView(contentRef, { once: true, amount: 0.35 });

  const lines = useMemo(() => {
    if (backgroundWords.length >= 6) {
      return backgroundWords.slice(0, 6);
    }

    const repeated: string[] = [];
    while (repeated.length < 6) {
      repeated.push(...backgroundWords);
    }
    return repeated.slice(0, 6);
  }, [backgroundWords]);

  useEffect(() => {
    if (reduceMotion) return undefined;

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
  }, [reduceMotion, springOpacity, springX, springY]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (reduceMotion) return;

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      spotlightX.set(((event.clientX - rect.left) / rect.width) * 100);
      spotlightY.set(((event.clientY - rect.top) / rect.height) * 100);
      spotlightOpacity.set(1);
    },
    [reduceMotion, spotlightOpacity, spotlightX, spotlightY]
  );

  const handleMouseLeave = useCallback(() => {
    spotlightOpacity.set(0);
  }, [spotlightOpacity]);

  const parallaxStyle = reduceMotion
    ? undefined
    : {
        y: backgroundY,
        scale: backgroundScale,
      };

  return (
    <section
      ref={sectionRef}
      className={`culture-typography${className ? ` ${className}` : ""}`}
      aria-labelledby="culture-typography-title"
      data-vibe-section="culture-typography"
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div className="culture-typography__atmosphere" aria-hidden />
      <div className="culture-typography__noise" aria-hidden />

      <div className="culture-typography__typography-stack" aria-hidden>
        <motion.div className="culture-typography__bg" style={parallaxStyle}>
          <BackgroundWords lines={lines} />
        </motion.div>

        {!reduceMotion ? (
          <motion.div className="culture-typography__bg-spotlight" style={parallaxStyle}>
            <BackgroundWords lines={lines} lit />
          </motion.div>
        ) : null}

        {!reduceMotion ? (
          <div className="culture-typography__spotlight-orb" />
        ) : null}
      </div>

      <div className="culture-typography__content">
        <motion.div
          ref={contentRef}
          className="culture-typography__content-inner"
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion || isInView ? "visible" : "hidden"}
          variants={contentVariants}
        >
          <motion.p className="culture-typography__meta" variants={itemVariants}>
            {metadataLabel}
          </motion.p>

          <motion.h2
            id="culture-typography-title"
            className="culture-typography__title"
            variants={itemVariants}
          >
            {title}
          </motion.h2>

          {subtitle ? (
            <motion.p className="culture-typography__subtitle" variants={itemVariants}>
              {subtitle}
            </motion.p>
          ) : null}

          <motion.div className="culture-typography__cta-wrap" variants={itemVariants}>
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.35, ease: EASE_PREMIUM }}
            >
              <Link href={buttonHref} className="culture-typography__cta">
                {buttonLabel}
                <span className="culture-typography__cta-icon" aria-hidden>
                  <ArrowRight size={18} strokeWidth={2.25} />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
