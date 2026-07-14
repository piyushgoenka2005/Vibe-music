import { MARKETING_EDITORIAL_IMAGE } from "@/lib/categoryImages";
import { ROUTES } from "@/lib/routes";
import type { BlogPostSummary } from "@/types/blog";

export interface HomepageBlogTeaserPost extends BlogPostSummary {
  /** Used for fallback cards when Firestore posts are unavailable. */
  fallbackHref?: string;
}

export const HOMEPAGE_BLOG_FALLBACK_POSTS: HomepageBlogTeaserPost[] = [
  {
    id: "fallback-home-studio",
    slug: "home-studio-essentials-2026",
    title: "Home Studio Essentials for 2026",
    excerpt:
      "The three pieces of gear that matter most when you are setting up your first recording space.",
    coverImage: MARKETING_EDITORIAL_IMAGE,
    tags: ["Studio", "Buying guide"],
    categorySlug: "studio",
    categoryLabel: "Studio",
    featured: true,
    authorName: "Vibe Music Team",
    publishedAt: null,
    status: "published",
    // Point at the index — never invent article slugs that 404 without seed.
    fallbackHref: ROUTES.blog,
  },
  {
    id: "fallback-guitar-guide",
    slug: "first-electric-guitar",
    title: "How to choose your first electric guitar",
    excerpt:
      "Body styles, pickups, and price tiers explained — so your first axe feels right from day one.",
    coverImage: "/images/guitar-1.webp",
    tags: ["Guitars", "Beginner"],
    categorySlug: "guitars",
    categoryLabel: "Guitars",
    featured: false,
    authorName: "Vibe Music Team",
    publishedAt: null,
    status: "published",
    fallbackHref: ROUTES.blog,
  },
  {
    id: "fallback-live-sound",
    slug: "live-sound-checklist",
    title: "Live sound checklist for small venues",
    excerpt:
      "PA placement, monitor mixes, and the gear we reach for when the room is tight on time.",
    coverImage: "/images/drum-1.webp",
    tags: ["Live sound", "Guides"],
    categorySlug: "live-sound",
    categoryLabel: "Live Sound",
    featured: false,
    authorName: "Vibe Music Team",
    publishedAt: null,
    status: "published",
    fallbackHref: ROUTES.blog,
  },
];
