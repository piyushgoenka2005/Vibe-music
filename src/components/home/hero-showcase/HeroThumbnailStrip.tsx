"use client";

import type { HeroShowcaseScene } from "@/data/heroShowcaseScenes";
import { MARKETING_HERO_FALLBACK } from "@/data/heroShowcaseScenes";

interface HeroThumbnailStripProps {
  scenes: HeroShowcaseScene[];
  activeIndex: number;
  failedSrc: Record<string, boolean>;
  onSelect: (index: number) => void;
}

export default function HeroThumbnailStrip({
  scenes,
  activeIndex,
  failedSrc,
  onSelect,
}: HeroThumbnailStripProps) {
  if (scenes.length <= 1) return null;

  return (
    <div className="hero-showcase__thumbs" role="tablist" aria-label="Showcase scenes">
      {scenes.map((scene, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={scene.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Scene ${index + 1}: ${scene.title}`}
            className={`hero-showcase__thumb${isActive ? " hero-showcase__thumb--active" : ""}`}
            onClick={() => onSelect(index)}
          >
            <img
              alt=""
              className="hero-showcase__thumb-image"
              decoding="async"
              loading="lazy"
              src={failedSrc[scene.src] ? MARKETING_HERO_FALLBACK : scene.src}
            />
          </button>
        );
      })}
    </div>
  );
}
