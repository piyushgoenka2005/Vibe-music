"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { HeroShowcaseScene } from "@/data/heroShowcaseScenes";
import { MARKETING_HERO_FALLBACK } from "@/data/heroShowcaseScenes";

export type HeroPanelVariant = "left" | "center" | "right";

export interface HeroPanelProps {
  scene: HeroShowcaseScene;
  variant: HeroPanelVariant;
  isActive?: boolean;
  imageFailed?: boolean;
  onImageError?: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroPanel({
  scene,
  variant,
  isActive = false,
  imageFailed = false,
  onImageError,
}: HeroPanelProps) {
  const src = imageFailed ? MARKETING_HERO_FALLBACK : scene.src;

  return (
    <motion.article
      className={`hero-showcase__panel hero-showcase__panel--${variant}${isActive ? " hero-showcase__panel--active" : ""}`}
      layout
      transition={{ duration: 0.85, ease: EASE }}
      aria-hidden={variant !== "center"}
    >
      <div className="hero-showcase__panel-frame">
        <div className="hero-showcase__panel-glow" aria-hidden />
        <img
          alt={scene.alt}
          className={`hero-showcase__panel-image${scene.fit === "cover" ? " hero-showcase__panel-image--cover" : ""}`}
          decoding="async"
          fetchPriority={isActive ? "high" : "low"}
          loading={isActive ? "eager" : "lazy"}
          src={src}
          style={scene.objectPosition ? { objectPosition: scene.objectPosition } : undefined}
          onError={onImageError}
        />
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
    </motion.article>
  );
}
