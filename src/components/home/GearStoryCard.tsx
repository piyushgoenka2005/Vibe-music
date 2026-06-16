"use client";

import { useRef } from "react";
import { useVisibleVideo } from "@/hooks/useVisibleVideo";
import type { GearStory } from "@/types/gear-story";
import GearStoryHotspot from "./GearStoryHotspot";

interface GearStoryCardProps {
  story: GearStory;
  isPaused: boolean;
  onOpen: (story: GearStory) => void;
}

export default function GearStoryCard({
  story,
  isPaused,
  onOpen,
}: GearStoryCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useVisibleVideo(videoRef, { forcePaused: isPaused });

  return (
    <article className="gear-story-card" data-story-id={story.id}>
      <div className="gear-story-card__media">
        <video
          ref={videoRef}
          className="gear-story-card__video"
          src={story.videoUrl}
          poster={story.posterUrl}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
        <div className="gear-story-card__gradient" aria-hidden="true" />
        <GearStoryHotspot
          onClick={() => onOpen(story)}
          label={`Shop ${story.brand} ${story.name}`}
        />
      </div>
    </article>
  );
}
