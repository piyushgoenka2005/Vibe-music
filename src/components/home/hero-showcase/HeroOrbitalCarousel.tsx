"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { HeroShowcaseScene } from "@/data/heroShowcaseScenes";
import { MARKETING_HERO_FALLBACK } from "@/data/heroShowcaseScenes";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

const ORBIT_SPEED_DEG = 10;

export interface HeroOrbitalCarouselProps {
  scenes: HeroShowcaseScene[];
  variant?: "showcase" | "compact";
  isPaused?: boolean;
  rotation: number;
  activeIndex: number;
  onRotationChange: (rotation: number) => void;
  failedSrc: Record<string, boolean>;
  onImageError: (src: string) => void;
}

function wrapIndex(index: number, count: number) {
  return ((index % count) + count) % count;
}

export function indexFromRotation(rotation: number, count: number) {
  if (count <= 0) return 0;
  const step = 360 / count;
  return wrapIndex(Math.round(rotation / step), count);
}

export function snapRotationToIndex(
  rotation: number,
  targetIndex: number,
  count: number
) {
  if (count <= 0) return rotation;
  const step = 360 / count;
  const currentIndex = indexFromRotation(rotation, count);
  let delta = targetIndex - currentIndex;
  if (delta > count / 2) delta -= count;
  if (delta < -count / 2) delta += count;
  return rotation + delta * step;
}

export function stepRotation(rotation: number, direction: 1 | -1, count: number) {
  if (count <= 0) return rotation;
  return rotation + direction * (360 / count);
}

export default function HeroOrbitalCarousel({
  scenes,
  variant = "showcase",
  isPaused = false,
  rotation,
  activeIndex,
  onRotationChange,
  failedSrc,
  onImageError,
}: HeroOrbitalCarouselProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const count = scenes.length;
  const rotationRef = useRef(rotation);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (reduceMotion || isPaused || count <= 1) return;

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      onRotationChange(rotationRef.current + ORBIT_SPEED_DEG * dt);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, isPaused, count, onRotationChange]);

  if (count === 0) return null;

  const radius = variant === "compact" ? 210 : 360;
  const frontScene = scenes[activeIndex]!;

  return (
    <div
      className={`hero-orbit hero-orbit--${variant}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="hero-orbit__floor" aria-hidden>
        <span className="hero-orbit__ring hero-orbit__ring--1" />
        <span className="hero-orbit__ring hero-orbit__ring--2" />
        <span className="hero-orbit__ring hero-orbit__ring--3" />
      </div>

      <div className="hero-orbit__stage">
        <div className="hero-orbit__track">
          {scenes.map((scene, index) => {
            const baseAngle = (360 / count) * index;
            const totalAngle = baseAngle + rotation;
            const rad = (totalAngle * Math.PI) / 180;
            const depth = Math.cos(rad);
            const opacity = 0.34 + 0.66 * ((depth + 1) / 2);
            const scale = 0.62 + 0.38 * ((depth + 1) / 2);
            const isFront = index === activeIndex && depth > 0.55;
            const src = failedSrc[scene.src] ? MARKETING_HERO_FALLBACK : scene.src;

            return (
              <article
                key={scene.id}
                className={`hero-orbit__card${isFront ? " hero-orbit__card--front" : ""}`}
                style={{
                  transform: `translate(-50%, -50%) rotateY(${totalAngle}deg) translateZ(${radius}px) rotateY(${-totalAngle}deg) scale(${scale})`,
                  opacity,
                  zIndex: Math.round(depth * 100) + 10,
                }}
                aria-hidden={!isFront}
              >
                <div className="hero-orbit__card-frame">
                  <div className="hero-orbit__card-glow" aria-hidden />
                  <img
                    alt={scene.alt}
                    className={`hero-orbit__card-image${
                      scene.fit === "cover" ? " hero-orbit__card-image--cover" : ""
                    }`}
                    decoding="async"
                    fetchPriority={isFront ? "high" : "low"}
                    loading={isFront ? "eager" : "lazy"}
                    src={src}
                    style={
                      scene.objectPosition
                        ? { objectPosition: scene.objectPosition }
                        : undefined
                    }
                    onError={() => onImageError(scene.src)}
                  />
                  {variant === "showcase" && isFront ? (
                    <div className="hero-orbit__card-copy">
                      <p className="hero-orbit__eyebrow">{scene.eyebrow}</p>
                      <h2 className="hero-orbit__title">{scene.title}</h2>
                      <p className="hero-orbit__subtitle">{scene.subtitle}</p>
                      <Link className="hero-orbit__cta" href={scene.ctaHref}>
                        {scene.ctaLabel}
                      </Link>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {variant === "compact" && frontScene ? (
        <p className="hero-orbit__compact-label">{frontScene.alt}</p>
      ) : null}
    </div>
  );
}
