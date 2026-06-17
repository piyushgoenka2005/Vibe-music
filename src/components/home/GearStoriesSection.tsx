"use client";

import { useState } from "react";
import type { GearStoriesSectionData, GearStory } from "@/types/gear-story";
import GearStoryCard from "./GearStoryCard";
import GearStoryModal from "./GearStoryModal";
import Reveal from "@/components/layout/Reveal";
import RevealGroup from "@/components/layout/RevealGroup";

interface GearStoriesSectionProps {
  data: GearStoriesSectionData;
}

export default function GearStoriesSection({ data }: GearStoriesSectionProps) {
  const [activeStory, setActiveStory] = useState<GearStory | null>(null);
  const modalOpen = Boolean(activeStory);

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

      <div className="gear-stories__strip-outer">
        <RevealGroup
          className="gear-stories__strip"
          as="div"
          role="list"
        >
          {data.stories.map((story, index) => (
            <div key={story.id} className="gear-stories__item" role="listitem">
              <GearStoryCard
                story={story}
                isPaused={modalOpen}
                playDelayMs={index * 120}
                onOpen={setActiveStory}
              />
            </div>
          ))}
        </RevealGroup>
      </div>

      <GearStoryModal story={activeStory} onClose={() => setActiveStory(null)} />
    </section>
  );
}
