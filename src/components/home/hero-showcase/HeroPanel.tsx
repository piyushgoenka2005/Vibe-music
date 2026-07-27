"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { HeroShowcaseScene } from "@/data/heroShowcaseScenes";
import { MARKETING_HERO_FALLBACK } from "@/data/heroShowcaseScenes";

export type HeroPanelVariant = "left" | "center" | "right";

const SLIDE_EASE = [0.22, 1, 0.36, 1] as const;

export const heroCenterSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "108%" : "-108%",
    opacity: 0.55,
    scale: 0.9,
    rotateY: direction > 0 ? -18 : 18,
    zIndex: 3,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: -3,
    zIndex: 3,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-108%" : "108%",
    opacity: 0.55,
    scale: 0.9,
    rotateY: direction > 0 ? 18 : -18,
    zIndex: 2,
  }),
};

export const heroCenterSlideTransition = {
  x: { type: "tween" as const, duration: 0.78, ease: SLIDE_EASE },
  opacity: { duration: 0.55, ease: SLIDE_EASE },
  scale: { duration: 0.78, ease: SLIDE_EASE },
  rotateY: { duration: 0.78, ease: SLIDE_EASE },
};

export interface HeroPanelProps extends Omit<HTMLMotionProps<"article">, "children"> {
  scene: HeroShowcaseScene;
  variant: HeroPanelVariant;
  isActive?: boolean;
  imageFailed?: boolean;
  onImageError?: () => void;
}

export default function HeroPanel({
  scene,
  variant,
  isActive = false,
  imageFailed = false,
  onImageError,
  className,
  ...motionProps
}: HeroPanelProps) {
  const src = imageFailed ? MARKETING_HERO_FALLBACK : scene.src;
  const imageClassName = `hero-showcase__panel-image${
    scene.fit === "cover" ? " hero-showcase__panel-image--cover" : ""
  }`;

  const panelClassName = [
    "hero-showcase__panel",
    `hero-showcase__panel--${variant}`,
    isActive ? "hero-showcase__panel--active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const frame = (
    <div className="hero-showcase__panel-frame">
      <div className="hero-showcase__panel-glow" aria-hidden />

      <div className="hero-showcase__panel-image-stack" aria-hidden={!isActive}>
        {/* eslint-disable-next-line @next/next/no-img-element -- hero panel active-state fetchPriority */}
        <img
          alt={scene.alt}
          className={imageClassName}
          decoding="async"
          fetchPriority={isActive ? "high" : "low"}
          loading={isActive ? "eager" : "lazy"}
          src={src}
          style={
            scene.objectPosition
              ? { objectPosition: scene.objectPosition }
              : undefined
          }
          onError={onImageError}
        />
      </div>

      <div className="hero-showcase__panel-vignette" aria-hidden />

      {isActive ? (
        <div className="hero-showcase__panel-copy">
          <p className="hero-showcase__eyebrow">{scene.eyebrow}</p>
          <h2 className="hero-showcase__title">{scene.title}</h2>
          <p className="hero-showcase__subtitle">{scene.subtitle}</p>
          <Link className="hero-showcase__cta" href={scene.ctaHref}>
            {scene.ctaLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );

  if (variant === "center") {
    return (
      <motion.article
        {...motionProps}
        className={panelClassName}
        aria-hidden={false}
      >
        {frame}
      </motion.article>
    );
  }

  return (
    <article className={panelClassName} aria-hidden>
      {frame}
    </article>
  );
}
