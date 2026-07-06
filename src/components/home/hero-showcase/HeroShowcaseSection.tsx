"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion } from "framer-motion";
import {
  HERO_SHOWCASE_SCENES,
  wrapSceneIndex,
} from "@/data/heroShowcaseScenes";
import AnimatedCanvasBackdrop from "@/components/home/hero-showcase/AnimatedCanvasBackdrop";
import HeroNavControls from "@/components/home/hero-showcase/HeroNavControls";
import HeroOrbitalCarousel, {
  indexFromRotation,
  snapRotationToIndex,
  stepRotation,
} from "@/components/home/hero-showcase/HeroOrbitalCarousel";
import HeroThumbnailStrip from "@/components/home/hero-showcase/HeroThumbnailStrip";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

const SCENES = HERO_SHOWCASE_SCENES;
const COUNT = SCENES.length;

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("button, a, input, textarea, select, label, [role='tab']")
  );
}

export default function HeroShowcaseSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const pointerStartRef = useRef({ x: 0, y: 0 });

  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedSrc, setFailedSrc] = useState<Record<string, boolean>>({});
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const reduceMotion = useHydrationSafeReducedMotion();

  const handleRotationChange = useCallback((nextRotation: number) => {
    setRotation(nextRotation);
    setActiveIndex(indexFromRotation(nextRotation, COUNT));
  }, []);

  const advanceTo = useCallback((index: number) => {
    if (COUNT === 0) return;
    setRotation((current) => snapRotationToIndex(current, index, COUNT));
    setActiveIndex(wrapSceneIndex(index, COUNT));
  }, []);

  const goNext = useCallback(() => {
    if (COUNT === 0) return;
    setRotation((current) => {
      const next = stepRotation(current, 1, COUNT);
      setActiveIndex(indexFromRotation(next, COUNT));
      return next;
    });
  }, []);

  const goPrev = useCallback(() => {
    if (COUNT === 0) return;
    setRotation((current) => {
      const next = stepRotation(current, -1, COUNT);
      setActiveIndex(indexFromRotation(next, COUNT));
      return next;
    });
  }, []);

  useEffect(() => {
    const next = SCENES[(activeIndex + 1) % COUNT];
    if (!next) return;
    const preload = new window.Image();
    preload.src = next.src;
  }, [activeIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (dragRef.current.active) {
        const dx = (event.clientX - pointerStartRef.current.x) / rect.width;
        const dy = (event.clientY - pointerStartRef.current.y) / rect.height;
        setPan({
          x: dragRef.current.x + dx * 1.6,
          y: dragRef.current.y + dy * 1.6,
        });
        return;
      }

      setPointer({
        x: (event.clientX - rect.left) / rect.width - 0.5,
        y: (event.clientY - rect.top) / rect.height - 0.5,
      });
    },
    []
  );

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(event.target)) return;

    dragRef.current.active = true;
    dragRef.current.x = pan.x;
    dragRef.current.y = pan.y;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [pan.x, pan.y]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleImageError = useCallback((src: string) => {
    setFailedSrc((prev) => ({ ...prev, [src]: true }));
  }, []);

  if (COUNT === 0) return null;

  const parallaxX = reduceMotion ? 0 : pointer.x * 18 + pan.x * 12;
  const parallaxY = reduceMotion ? 0 : pointer.y * 12 + pan.y * 10;

  return (
    <section
      className="hero-showcase"
      aria-roledescription="carousel"
      aria-label="Featured gear showcase"
      data-vibe-section="hero-showcase"
      onMouseLeave={() => setPan({ x: 0, y: 0 })}
    >
      <div
        ref={stageRef}
        className="hero-showcase__stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <AnimatedCanvasBackdrop
          panX={pan.x}
          panY={pan.y}
          pointerX={pointer.x}
          pointerY={pointer.y}
        />

        <div className="hero-showcase__atmosphere" aria-hidden />
        <div className="hero-showcase__grid" aria-hidden />
        <div className="hero-showcase__noise" aria-hidden />

        <motion.div
          className="hero-showcase__orbit-viewport"
          style={{ x: parallaxX, y: parallaxY }}
          transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.6 }}
        >
          <HeroOrbitalCarousel
            scenes={SCENES}
            variant="showcase"
            isPaused={isPaused}
            rotation={rotation}
            activeIndex={activeIndex}
            onRotationChange={handleRotationChange}
            failedSrc={failedSrc}
            onImageError={handleImageError}
          />
        </motion.div>

        <div
          className="hero-showcase__controls"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsPaused(false);
            }
          }}
        >
          <HeroNavControls onNext={goNext} onPrev={goPrev} />

          <HeroThumbnailStrip
            activeIndex={activeIndex}
            failedSrc={failedSrc}
            scenes={SCENES}
            onSelect={advanceTo}
          />
        </div>
      </div>
    </section>
  );
}
