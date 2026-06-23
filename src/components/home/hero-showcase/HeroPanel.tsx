"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { HeroShowcaseScene } from "@/data/heroShowcaseScenes";
import { MARKETING_HERO_FALLBACK } from "@/data/heroShowcaseScenes";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

export type HeroPanelVariant = "left" | "center" | "right";

export interface HeroPanelProps {
  scene: HeroShowcaseScene;
  variant: HeroPanelVariant;
  isActive?: boolean;
  imageFailed?: boolean;
  onImageError?: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const IMAGE_TRANSITION = { duration: 0.7, ease: EASE } as const;

export default function HeroPanel({
  scene,
  variant,
  isActive = false,
  imageFailed = false,
  onImageError,
}: HeroPanelProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const src = imageFailed ? MARKETING_HERO_FALLBACK : scene.src;
  const imageClassName = `hero-showcase__panel-image${
    scene.fit === "cover" ? " hero-showcase__panel-image--cover" : ""
  }`;

  return (
    <article
      className={`hero-showcase__panel hero-showcase__panel--${variant}${
        isActive ? " hero-showcase__panel--active" : ""
      }`}
      aria-hidden={variant !== "center"}
    >
      <div className="hero-showcase__panel-frame">
        <div className="hero-showcase__panel-glow" aria-hidden />

        <div className="hero-showcase__panel-image-stack" aria-hidden={!isActive}>
          <AnimatePresence initial={false} mode="sync">
            <motion.img
              key={src}
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
              initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
              animate={
                reduceMotion
                  ? { opacity: 1, scale: 1.02 }
                  : { opacity: 1, scale: 1.02 }
              }
              exit={reduceMotion ? undefined : { opacity: 0, scale: 1 }}
              transition={reduceMotion ? { duration: 0 } : IMAGE_TRANSITION}
              onError={onImageError}
            />
          </AnimatePresence>
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
    </article>
  );
}
