/** Local reel MP4s served from /public/videos — cycle for every card slot. */
export const REEL_VIDEO_SOURCES = [
  "/videos/gear-stories/guitar-over.mp4",
  "/videos/gear-stories/avusinc-video.mp4",
  "/videos/gear-stories/holy-man-chanting.mp4",
] as const;

export function getReelVideoUrl(cardIndex: number): string {
  const safeIndex =
    ((cardIndex % REEL_VIDEO_SOURCES.length) + REEL_VIDEO_SOURCES.length) %
    REEL_VIDEO_SOURCES.length;
  return REEL_VIDEO_SOURCES[safeIndex];
}

/** File names used when mirroring sources into /public/videos/style-story/. */
export const REEL_VIDEO_MIRROR_NAMES = [
  "reel-1.mp4",
  "reel-2.mp4",
  "reel-3.mp4",
  "reel-4.mp4",
  "reel-5.mp4",
  "reel-6.mp4",
] as const;

export function getMirroredReelVideoUrl(cardIndex: number): string {
  const name =
    REEL_VIDEO_MIRROR_NAMES[cardIndex] ??
    REEL_VIDEO_MIRROR_NAMES[cardIndex % REEL_VIDEO_MIRROR_NAMES.length];
  return `/videos/style-story/${name}`;
}
