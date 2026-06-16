"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GearStoriesSectionData, GearStory } from "@/types/gear-story";
import GearStoryCard from "./GearStoryCard";
import GearStoryModal from "./GearStoryModal";

interface GearStoriesSectionProps {
  data: GearStoriesSectionData;
}

export default function GearStoriesSection({ data }: GearStoriesSectionProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeStory, setActiveStory] = useState<GearStory | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const modalOpen = Boolean(activeStory);

  const updateScrollState = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const maxScroll = strip.scrollWidth - strip.clientWidth;
    setCanScrollLeft(strip.scrollLeft > 8);
    setCanScrollRight(strip.scrollLeft < maxScroll - 8);
  }, []);

  const scrollStrip = useCallback((direction: "left" | "right") => {
    const strip = stripRef.current;
    if (!strip) return;

    const card = strip.querySelector<HTMLElement>(".gear-story-card");
    const step = card ? card.offsetWidth + 16 : 276;
    strip.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, data.stories.length]);

  function openStory(story: GearStory) {
    setActiveStory(story);
  }

  function closeModal() {
    setActiveStory(null);
  }

  if (data.stories.length === 0) return null;

  return (
    <section
      className="gear-stories"
      aria-labelledby="gear-stories-heading"
    >
      <header className="gear-stories__header">
        <h2 id="gear-stories-heading" className="gear-stories__title">
          {data.title}
        </h2>
        {data.subtitle ? (
          <p className="gear-stories__subtitle">{data.subtitle}</p>
        ) : null}
      </header>

      <div className="gear-stories__strip-outer">
        <button
          type="button"
          className="gear-stories__arrow gear-stories__arrow--left"
          onClick={() => scrollStrip("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll stories left"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>

        <div
          ref={stripRef}
          className="gear-stories__strip"
          role="list"
          onScroll={updateScrollState}
        >
          {data.stories.map((story) => (
            <div key={story.id} className="gear-stories__item" role="listitem">
              <GearStoryCard
                story={story}
                isPaused={modalOpen}
                onOpen={openStory}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="gear-stories__arrow gear-stories__arrow--right"
          onClick={() => scrollStrip("right")}
          disabled={!canScrollRight}
          aria-label="Scroll stories right"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <GearStoryModal story={activeStory} onClose={closeModal} />
    </section>
  );
}
