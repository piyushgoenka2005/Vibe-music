"use client";

import { useEffect, useRef } from "react";
import type { StyleStoryItem } from "@/data/styleStory";

interface StyleStoryCardProps {
  item: StyleStoryItem;
}

function tryPlay(video: HTMLVideoElement) {
  video.muted = true;
  video.defaultMuted = true;
  return video.play().catch(() => undefined);
}

export default function StyleStoryCard({ item }: StyleStoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    const onCanPlay = () => {
      if (isActiveRef.current) void tryPlay(video);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting) {
          isActiveRef.current = true;
          void tryPlay(video);
        } else {
          isActiveRef.current = false;
          video.pause();
          video.currentTime = 0;
        }
      },
      { threshold: 0.2, rootMargin: "80px 0px" }
    );

    video.addEventListener("canplay", onCanPlay);
    observer.observe(card);

    return () => {
      observer.disconnect();
      video.removeEventListener("canplay", onCanPlay);
      video.pause();
    };
  }, []);

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
