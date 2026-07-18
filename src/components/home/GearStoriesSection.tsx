"use client";

import { useCallback, useState } from "react";
import Marquee from "@/components/common/Marquee";
import type { GearStoriesSectionData, GearStory } from "@/types/gear-story";
import GearStoryCard from "./GearStoryCard";
import GearStoryModal from "./GearStoryModal";
import Reveal from "@/components/layout/Reveal";

interface GearStoriesSectionProps {
  data: GearStoriesSectionData;
}

export default function GearStoriesSection({ data }: GearStoriesSectionProps) {
  const [activeStory, setActiveStory] = useState<GearStory | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [userPausedKeys, setUserPausedKeys] = useState<Set<string>>(
    () => new Set()
  );
  const modalOpen = Boolean(activeStory);
  const playbackLocked = modalOpen || isHovered;
  const isStripPaused = playbackLocked || userPausedKeys.size > 0;

  const handleUserPauseChange = useCallback((cardKey: string, paused: boolean) => {
    setUserPausedKeys((prev) => {
      const next = new Set(prev);
      if (paused) next.add(cardKey);
      else next.delete(cardKey);
      return next;
    });
  }, []);

  if (data.stories.length === 0) return null;

  return (
    <section className="gear-stories" aria-labelledby="gear-stories-heading">
      <Reveal as="header" className="gear-stories__header">
        <h2 id="gear-stories-heading" className="gear-stories__title typo-series">
          {data.title}
        </h2>
        {data.subtitle ? (
          <p className="gear-stories__subtitle">{data.subtitle}</p>
        ) : null}
      </Reveal>

      <div
        className="gear-stories__strip-outer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Marquee
          ariaLabel="Gear style story reels"
          className={[
            "gear-stories__marquee",
            isStripPaused ? "gear-stories__marquee--paused" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          duration="42s"
          pauseOnHover={false}
          role="region"
          sequenceClassName="gear-stories__sequence"
          trackClassName="gear-stories__marquee-track"
        >
          {[...data.stories, ...data.stories].map((story, index) => {
            const cardKey = `${story.id}-${index}`;

            return (
            <div
              key={cardKey}
              className="gear-stories__item"
              role="listitem"
            >
              <GearStoryCard
                story={story}
                cardKey={cardKey}
                playbackLocked={playbackLocked}
                playDelayMs={(index % data.stories.length) * 120}
                onUserPauseChange={handleUserPauseChange}
                onOpen={setActiveStory}
              />
            </div>
            );
          })}
        </Marquee>
      </div>

      <GearStoryModal story={activeStory} onClose={() => setActiveStory(null)} />
    </section>
  );
}
