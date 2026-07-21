"use client";

import { useCallback, useRef, useState } from "react";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import { STYLE_STORY_REELS } from "@/data/styleStory";
import { useVisibleVideo } from "@/hooks/useVisibleVideo";
import type { GearStory } from "@/types/gear-story";
import GearStoryHotspot from "./GearStoryHotspot";

function InstagramGlyph() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

interface GearStoryCardProps {
  story: GearStory;
  cardKey: string;
  playbackLocked: boolean;
  playDelayMs?: number;
  onUserPauseChange: (cardKey: string, paused: boolean) => void;
  onOpen: (story: GearStory) => void;
}

export default function GearStoryCard({
  story,
  cardKey,
  playbackLocked,
  playDelayMs = 0,
  onUserPauseChange,
  onOpen,
}: GearStoryCardProps) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const [userPaused, setUserPaused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const reelUrl =
    STYLE_STORY_REELS.find((reel) => reel.videoSrc === story.videoUrl)?.reelUrl ??
    SOCIAL_LINKS.instagram;

  useVisibleVideo(videoRef, containerRef, {
    forcePaused: playbackLocked || userPaused,
    manualPausedRef: userPausedRef,
    playDelayMs,
    visibilityRatio: 0.35,
  });

  const togglePause = useCallback(() => {
    if (playbackLocked) return;

    const video = videoRef.current;
    if (!video) return;

    const nextPaused = !userPausedRef.current;
    userPausedRef.current = nextPaused;

    if (nextPaused) {
      video.pause();
    } else {
      void video.play().catch(() => {});
    }

    setUserPaused(nextPaused);
    onUserPauseChange(cardKey, nextPaused);
  }, [cardKey, onUserPauseChange, playbackLocked]);

  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if ((event.target as HTMLElement).closest("a, button")) return;
      togglePause();
    },
    [togglePause]
  );

  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if ((event.target as HTMLElement).closest("a, button")) return;
      event.preventDefault();
      togglePause();
    },
    [togglePause]
  );

  return (
    <article
      ref={containerRef}
      className={[
        "gear-story-card",
        userPaused ? "gear-story-card--paused" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-story-id={story.id}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={0}
      aria-label={
        userPaused
          ? `Paused reel for ${story.name}. Press to resume.`
          : `Playing reel for ${story.name}. Press to pause.`
      }
    >
      <div className="gear-story-card__media">
        {videoFailed || !story.videoUrl ? (
          // Posters until reel MP4s are deployed under /public/videos on the VPS.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="gear-story-card__video gear-story-card__poster"
            src={story.posterUrl}
            alt=""
            aria-hidden="true"
          />
        ) : (
          <video
            ref={videoRef}
            className="gear-story-card__video"
            src={story.videoUrl}
            poster={story.posterUrl || undefined}
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            controls={false}
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
          />
        )}
        <div className="gear-story-card__overlay">
          <a
            href={reelUrl}
            className="gear-story-card__handle"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            <InstagramGlyph />
            <span>{SOCIAL_LINKS.instagramHandle}</span>
          </a>
          <GearStoryHotspot
            onClick={() => onOpen(story)}
            label={`Shop ${story.brand} ${story.name}`}
          />
        </div>
      </div>
    </article>
  );
}
