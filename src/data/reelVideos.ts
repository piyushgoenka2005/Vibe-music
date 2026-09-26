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

function reelVideoBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_REEL_VIDEO_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const cdn = process.env.NEXT_PUBLIC_CDN_PUBLIC_BASE_URL?.trim();
  if (cdn) return cdn.replace(/\/$/, "");

  return "";
}

function resolveReelVideoPath(relativePath: string): string {
  const base = reelVideoBaseUrl();
  if (!base) return relativePath;
  return `${base}${relativePath}`;
}

export function getMirroredReelVideoUrl(cardIndex: number, optimized = false): string {
  const name =
    REEL_VIDEO_MIRROR_NAMES[cardIndex] ??
    REEL_VIDEO_MIRROR_NAMES[cardIndex % REEL_VIDEO_MIRROR_NAMES.length];
  const stem = name.replace(/\.mp4$/i, "");
  const fileName = optimized ? `${stem}-opt.mp4` : name;
  return resolveReelVideoPath(`/videos/style-story/${fileName}`);
}

/** Full-quality fallback when the compressed variant is missing on CDN/origin. */
export function getMirroredReelVideoFallbackUrl(cardIndex: number): string {
  return getMirroredReelVideoUrl(cardIndex, false);
}

/** Ordered playback candidates — full origin file first, then CDN opt, then legacy pool. */
export function getReelVideoCandidateUrls(cardIndex: number): string[] {
  const safeIndex =
    ((cardIndex % REEL_VIDEO_MIRROR_NAMES.length) + REEL_VIDEO_MIRROR_NAMES.length) %
    REEL_VIDEO_MIRROR_NAMES.length;

  const candidates = [
    getMirroredReelVideoUrl(safeIndex, false),
    getMirroredReelVideoUrl(safeIndex, true),
    getReelVideoUrl(safeIndex),
  ];

  return candidates.filter((url, index) => url && candidates.indexOf(url) === index);
}
