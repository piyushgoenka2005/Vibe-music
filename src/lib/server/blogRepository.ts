import "server-only";

import { randomUUID } from "crypto";
import * as pg from "@/lib/server/prisma/contentRepository";
import { slugify } from "@/lib/slug";
import type {
  BlogPost,
  BlogPostStatus,
  BlogPostSummary,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "@/types/blog";

function now(): string {
  return new Date().toISOString();
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((tag) => String(tag).trim()).filter(Boolean))];
}

function normalizeStatus(value: unknown): BlogPostStatus {
  if (value === "published" || value === "scheduled") return value;
  return "draft";
}

export function isBlogUnavailable(): boolean {
  return false;
}

export function isBlogPostPublic(post: BlogPost, at = new Date()): boolean {
  if (post.status === "published") return true;
  if (post.status === "scheduled" && post.scheduledAt) {
    const scheduled = new Date(post.scheduledAt);
    return !Number.isNaN(scheduled.getTime()) && scheduled <= at;
  }
  return false;
}

function effectivePublishedAt(post: BlogPost, at = new Date()): string | null {
  if (post.status === "published") {
    return post.publishedAt ?? post.updatedAt ?? post.createdAt;
  }
  if (post.status === "scheduled" && isBlogPostPublic(post, at)) {
    return post.scheduledAt ?? post.publishedAt;
  }
  return null;
}

function toSummary(post: BlogPost, at = new Date()): BlogPostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    tags: post.tags,
    authorName: post.authorName,
    publishedAt: effectivePublishedAt(post, at),
    status: post.status,
  };
}

function resolvePublishFields(
  status: BlogPostStatus,
  scheduledAt: string | null | undefined,
  existingPublishedAt: string | null,
  timestamp: string
): { publishedAt: string | null; scheduledAt: string | null } {
  if (status === "draft") {
    return { publishedAt: existingPublishedAt, scheduledAt: null };
  }
  if (status === "scheduled") {
    return {
      publishedAt: existingPublishedAt,
      scheduledAt: scheduledAt ?? null,
    };
  }
  return {
    publishedAt: existingPublishedAt ?? timestamp,
    scheduledAt: null,
  };
}

export async function listAllBlogPosts(): Promise<BlogPost[]> {
  return pg.listAllBlogPosts() as Promise<BlogPost[]>;
}

export async function listPublicBlogPosts(
  at = new Date(),
  options?: { limit?: number }
): Promise<BlogPostSummary[]> {
  const posts = (await listAllBlogPosts()).filter((post) => isBlogPostPublic(post, at));
  return posts
    .map((post) => toSummary(post, at))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, options?.limit && options.limit > 0 ? options.limit : undefined);
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  return pg.getBlogPostById(id) as Promise<BlogPost | null>;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return pg.getBlogPostBySlug(slug) as Promise<BlogPost | null>;
}

export async function getPublicBlogPostBySlug(
  slug: string,
  at = new Date()
): Promise<BlogPost | null> {
  const post = await getBlogPostBySlug(slug);
  if (!post || !isBlogPostPublic(post, at)) return null;
  return post;
}

export async function listPublicBlogSlugs(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const at = new Date();
  return (await listAllBlogPosts())
    .filter((post) => isBlogPostPublic(post, at))
    .map((post) => ({ slug: post.slug, updatedAt: post.updatedAt }));
}

export async function createBlogPost(
  input: CreateBlogPostInput
): Promise<BlogPost> {
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error("Slug is required");

  if (await pg.blogSlugExists(slug)) {
    throw new Error("A post with this slug already exists");
  }

  if (input.status === "scheduled" && !input.scheduledAt) {
    throw new Error("Scheduled posts require a publish date");
  }

  const timestamp = now();
  const publishFields = resolvePublishFields(
    input.status,
    input.scheduledAt,
    null,
    timestamp
  );

  return pg.createBlogPostRecord({
    id: randomUUID(),
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() ?? "",
    content: input.content,
    coverImage: input.coverImage?.trim() ?? "",
    tags: normalizeTags(input.tags),
    seoTitle: input.seoTitle?.trim() ?? "",
    seoDescription: input.seoDescription?.trim() ?? "",
    status: input.status,
    authorId: input.authorId,
    authorName: input.authorName,
    publishedAt: publishFields.publishedAt,
    scheduledAt: publishFields.scheduledAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateBlogPost(
  id: string,
  input: UpdateBlogPostInput
): Promise<BlogPost> {
  const existing = await getBlogPostById(id);
  if (!existing) throw new Error("Blog post not found");

  const nextStatus = input.status ?? existing.status;
  const nextScheduledAt =
    input.scheduledAt !== undefined ? input.scheduledAt : existing.scheduledAt;

  if (nextStatus === "scheduled" && !nextScheduledAt) {
    throw new Error("Scheduled posts require a publish date");
  }

  let nextSlug = existing.slug;
  if (input.slug !== undefined) {
    nextSlug = slugify(input.slug);
    if (!nextSlug) throw new Error("Slug is required");
    if (nextSlug !== existing.slug && (await pg.blogSlugExists(nextSlug, id))) {
      throw new Error("A post with this slug already exists");
    }
  }

  const timestamp = now();
  const publishFields = resolvePublishFields(
    nextStatus,
    nextScheduledAt,
    existing.publishedAt,
    timestamp
  );

  return pg.updateBlogPostRecord(id, {
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.slug !== undefined ? { slug: nextSlug } : {}),
    ...(input.excerpt !== undefined ? { excerpt: input.excerpt.trim() } : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    ...(input.coverImage !== undefined ? { coverImage: input.coverImage.trim() } : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle.trim() } : {}),
    ...(input.seoDescription !== undefined
      ? { seoDescription: input.seoDescription.trim() }
      : {}),
    ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
    publishedAt: publishFields.publishedAt,
    scheduledAt: publishFields.scheduledAt,
    updatedAt: timestamp,
  });
}

export async function deleteBlogPost(id: string): Promise<void> {
  const existing = await getBlogPostById(id);
  if (!existing) throw new Error("Blog post not found");
  await pg.deleteBlogPostRecord(id);
}
