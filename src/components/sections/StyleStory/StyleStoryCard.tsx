"use client";

import { useRef, type RefObject } from "react";
import { useVisibleVideo } from "@/hooks/useVisibleVideo";
import type { StyleStoryItem } from "@/data/styleStory";

interface StyleStoryCardProps {
  item: StyleStoryItem;
  scrollRootRef?: RefObject<HTMLElement | null>;
}

export default function StyleStoryCard({
  item,
  scrollRootRef,
}: StyleStoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useVisibleVideo(videoRef, cardRef, {
    scrollRootRef,
    visibilityRatio: 0.15,
  });

  function openReel() {
    window.open(item.reelUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      ref={cardRef}
      className="style-story-card"
      role="button"
      tabIndex={0}
      onClick={openReel}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openReel();
        }
      }}
      aria-label={`Watch reel on Instagram — ${item.alt}`}
    >
      <video
        ref={videoRef}
        className="style-story-card__video"
        src={item.videoSrc}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        controls={false}
      />
    </div>
  );
}
