"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HERO_SHOWCASE_SCENES,
  MARKETING_HERO_ROTATE_MS,
  wrapSceneIndex,
} from "@/data/heroShowcaseScenes";
import AnimatedCanvasBackdrop from "@/components/home/hero-showcase/AnimatedCanvasBackdrop";
import HeroNavControls from "@/components/home/hero-showcase/HeroNavControls";
import HeroPanel from "@/components/home/hero-showcase/HeroPanel";
import HeroThumbnailStrip from "@/components/home/hero-showcase/HeroThumbnailStrip";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

const SCENES = HERO_SHOWCASE_SCENES;
const COUNT = SCENES.length;

export default function HeroShowcaseSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const pointerStartRef = useRef({ x: 0, y: 0 });

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedSrc, setFailedSrc] = useState<Record<string, boolean>>({});
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const reduceMotion = useHydrationSafeReducedMotion();

  const goTo = useCallback((index: number) => {
    if (COUNT === 0) return;
    setActiveIndex(wrapSceneIndex(index, COUNT));
  }, []);

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (COUNT <= 1 || isPaused || reduceMotion) return;
    const timer = window.setInterval(goNext, MARKETING_HERO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused, reduceMotion]);

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

  const activeScene = SCENES[activeIndex]!;
  const prevScene = SCENES[wrapSceneIndex(activeIndex - 1)]!;
  const nextScene = SCENES[wrapSceneIndex(activeIndex + 1)]!;

  const parallaxX = reduceMotion ? 0 : pointer.x * 18 + pan.x * 12;
  const parallaxY = reduceMotion ? 0 : pointer.y * 12 + pan.y * 10;

  return (
    <section
      className="hero-showcase"
      aria-roledescription="carousel"
      aria-label="Featured gear showcase"
      data-vibe-section="hero-showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        setPan({ x: 0, y: 0 });
      }}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
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
          className={`hero-showcase__panels${isMobile ? " hero-showcase__panels--mobile" : ""}`}
          style={{
            x: parallaxX,
            y: parallaxY,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.6 }}
        >
          {!isMobile ? (
            <>
              <HeroPanel
                scene={prevScene}
                variant="left"
                imageFailed={Boolean(failedSrc[prevScene.src])}
                onImageError={() => handleImageError(prevScene.src)}
              />
              <AnimatePresence mode="popLayout" initial={false}>
                <HeroPanel
                  key={activeScene.id}
                  scene={activeScene}
                  variant="center"
                  isActive
                  imageFailed={Boolean(failedSrc[activeScene.src])}
                  onImageError={() => handleImageError(activeScene.src)}
                />
              </AnimatePresence>
              <HeroPanel
                scene={nextScene}
                variant="right"
                imageFailed={Boolean(failedSrc[nextScene.src])}
                onImageError={() => handleImageError(nextScene.src)}
              />
            </>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <HeroPanel
                key={activeScene.id}
                scene={activeScene}
                variant="center"
                isActive
                imageFailed={Boolean(failedSrc[activeScene.src])}
                onImageError={() => handleImageError(activeScene.src)}
              />
            </AnimatePresence>
          )}
        </motion.div>

        <HeroNavControls onNext={goNext} onPrev={goPrev} />

        <HeroThumbnailStrip
          activeIndex={activeIndex}
          failedSrc={failedSrc}
          scenes={SCENES}
          onSelect={goTo}
        />
      </div>
    </section>
  );
}
