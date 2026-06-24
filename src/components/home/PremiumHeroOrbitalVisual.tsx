"use client";

import { useCallback, useState } from "react";
import { HERO_SHOWCASE_SCENES } from "@/data/heroShowcaseScenes";
import HeroOrbitalCarousel, {
  indexFromRotation,
  snapRotationToIndex,
} from "@/components/home/hero-showcase/HeroOrbitalCarousel";

const SCENES = HERO_SHOWCASE_SCENES;
const COUNT = SCENES.length;

export default function PremiumHeroOrbitalVisual() {
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedSrc, setFailedSrc] = useState<Record<string, boolean>>({});

  const handleRotationChange = useCallback((nextRotation: number) => {
    setRotation(nextRotation);
    setActiveIndex(indexFromRotation(nextRotation, COUNT));
  }, []);

  const goTo = useCallback((index: number) => {
    setRotation((current) => snapRotationToIndex(current, index, COUNT));
    setActiveIndex(index);
  }, []);

  if (COUNT === 0) return null;

  return (
    <div
      className="premium-hero__orbit-wrap"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <HeroOrbitalCarousel
        scenes={SCENES}
        variant="compact"
        isPaused={isPaused}
        rotation={rotation}
        activeIndex={activeIndex}
        onRotationChange={handleRotationChange}
        failedSrc={failedSrc}
        onImageError={(src) => setFailedSrc((prev) => ({ ...prev, [src]: true }))}
      />

      {COUNT > 1 ? (
        <div className="premium-hero__orbit-dots" role="tablist" aria-label="Hero products">
          {SCENES.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show ${scene.alt}`}
              className={`premium-hero__orbit-dot${
                index === activeIndex ? " premium-hero__orbit-dot--active" : ""
              }`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
