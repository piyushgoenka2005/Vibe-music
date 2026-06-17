/** Social & newsletter URLs — override via environment variables for CMS/production. */
export const SOCIAL_LINKS = {
  facebook:
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ??
    "https://www.facebook.com/vibemusic",
  twitter:
    process.env.NEXT_PUBLIC_SOCIAL_TWITTER ?? "https://x.com/vibemusic",
  instagram:
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ??
    "https://www.instagram.com/vibemusic",
  linkedin:
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ??
    "https://www.linkedin.com/company/vibemusic",
  youtube:
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ??
    "https://www.youtube.com/@vibemusic",
  newsletter:
    process.env.NEXT_PUBLIC_NEWSLETTER_URL ?? "#newsletter",
  instagramHandle:
    process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "@vibemusic",
} as const;

export type SocialPlatform = keyof Omit<typeof SOCIAL_LINKS, "newsletter">;
