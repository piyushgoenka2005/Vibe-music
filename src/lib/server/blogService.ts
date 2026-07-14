import "server-only";

import { unstable_cache } from "next/cache";
import type { BlogPostSummary } from "@/types/blog";

export {
  createBlogPost,
  createBlogComment,
  deleteBlogPost,
  getBlogAnalytics,
  getBlogPostById,
  getBlogPostBySlug,
  getPublicBlogPostBySlug,
  getRelatedPublicPosts,
  isBlogPostPublic,
  isBlogUnavailable,
  listAllBlogPosts,
  listApprovedBlogComments,
  listBlogCommentsForAdmin,
  listPublicBlogPostsPaginated,
  listPublicBlogSlugs,
  recordBlogShare,
  recordBlogView,
  updateBlogCommentStatus,
  updateBlogPost,
} from "@/lib/server/blogRepository";

import { listPublicBlogPosts as loadPublicBlogPosts } from "@/lib/server/blogRepository";

const BLOG_PUBLIC_REVALIDATE_SECONDS = 120;

const getCachedPublicBlogPosts = unstable_cache(
  async (dayKey: string, limit?: number): Promise<BlogPostSummary[]> =>
    loadPublicBlogPosts(
      new Date(`${dayKey}T12:00:00.000Z`),
      limit ? { limit } : undefined
    ),
  ["public-blog-posts"],
  { revalidate: BLOG_PUBLIC_REVALIDATE_SECONDS, tags: ["blog"] }
);

export async function listPublicBlogPosts(
  at: Date = new Date(),
  options?: { limit?: number }
): Promise<BlogPostSummary[]> {
  const dayKey = at.toISOString().slice(0, 10);
  return getCachedPublicBlogPosts(dayKey, options?.limit);
}
