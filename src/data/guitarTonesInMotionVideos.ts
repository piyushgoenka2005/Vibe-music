export interface GuitarToneVideo {
  id: string;
  title: string;
  embedUrl: string;
}

/** Fixed guitar tone demo videos shown on all guitar product pages. */
export const GUITAR_TONES_IN_MOTION_VIDEOS: GuitarToneVideo[] = [
  {
    id: "tone-video-1",
    title: "YouTube video player",
    embedUrl: "https://www.youtube.com/embed/2XTd9-FnInw?si=hQHICLxkw4-8tUKp",
  },
  {
    id: "tone-video-2",
    title: "YouTube video player",
    embedUrl: "https://www.youtube.com/embed/tqhfHckIr7Y?si=XZqP9K3vsizko7fe",
  },
  {
    id: "tone-video-3",
    title: "YouTube video player",
    embedUrl: "https://www.youtube.com/embed/tKHhrytCxUU?si=8UmA40MSX9-ciWxf",
  },
];
