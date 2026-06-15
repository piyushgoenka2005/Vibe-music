import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { slugify } from "@/lib/slug";
import type {
  BlogPost,
  BlogPostStatus,
  BlogPostSummary,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "@/types/blog";

const COLLECTION = "blog_posts";

function now(): string {
  return new Date().toISOString();
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((tag) => String(tag).trim()).filter(Boolean))];
}

function normalizePost(
  id: string,
  data: FirebaseFirestore.DocumentData
): BlogPost {
  return {
    id,
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    content: String(data.content ?? ""),
    contentFormat: "tiptap_json",
    coverImage: String(data.coverImage ?? ""),
    tags: normalizeTags(data.tags),
    seoTitle: String(data.seoTitle ?? ""),
    seoDescription: String(data.seoDescription ?? ""),
    status: normalizeStatus(data.status),
    authorId: String(data.authorId ?? ""),
    authorName: String(data.authorName ?? ""),
    publishedAt: data.publishedAt ? String(data.publishedAt) : null,
    scheduledAt: data.scheduledAt ? String(data.scheduledAt) : null,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

function normalizeStatus(value: unknown): BlogPostStatus {
  if (value === "published" || value === "scheduled") return value;
  return "draft";
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

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return false;
  if (excludeId && snap.docs[0]?.id === excludeId) return false;
  return true;
}

export async function listAllBlogPosts(): Promise<BlogPost[]> {
  const snap = await getAdminFirestore().collection(COLLECTION).get();
  return snap.docs
    .map((doc) => normalizePost(doc.id, doc.data()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listPublicBlogPosts(
  at = new Date()
): Promise<BlogPostSummary[]> {
  const db = getAdminFirestore();
  const isoNow = at.toISOString();

  const [publishedSnap, scheduledSnap] = await Promise.all([
    db
      .collection(COLLECTION)
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .get()
      .catch(async () => {
        const fallback = await db
          .collection(COLLECTION)
          .where("status", "==", "published")
          .get();
        return fallback;
      }),
    db
      .collection(COLLECTION)
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", isoNow)
      .orderBy("scheduledAt", "desc")
      .get()
      .catch(async () => {
        const fallback = await db
          .collection(COLLECTION)
          .where("status", "==", "scheduled")
          .get();
        return fallback;
      }),
  ]);

  const posts = [
    ...publishedSnap.docs.map((doc) => normalizePost(doc.id, doc.data())),
    ...scheduledSnap.docs
      .map((doc) => normalizePost(doc.id, doc.data()))
      .filter((post) => isBlogPostPublic(post, at)),
  ];

  const unique = new Map<string, BlogPost>();
  posts.forEach((post) => unique.set(post.id, post));

  return [...unique.values()]
    .map((post) => toSummary(post, at))
    .sort((a, b) =>
      (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
    );
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const doc = await getAdminFirestore().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return normalizePost(doc.id, doc.data()!);
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return normalizePost(doc.id, doc.data());
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
  const db = getAdminFirestore();

  const [publishedSnap, scheduledSnap] = await Promise.all([
    db.collection(COLLECTION).where("status", "==", "published").get(),
    db.collection(COLLECTION).where("status", "==", "scheduled").get(),
  ]);

  const at = new Date();
  return [...publishedSnap.docs, ...scheduledSnap.docs]
    .map((doc) => normalizePost(doc.id, doc.data()))
    .filter((post) => isBlogPostPublic(post, at))
    .map((post) => ({ slug: post.slug, updatedAt: post.updatedAt }));
}

export async function createBlogPost(
  input: CreateBlogPostInput
): Promise<BlogPost> {
  const db = getAdminFirestore();
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error("Slug is required");

  if (await slugExists(slug)) {
    throw new Error("A post with this slug already exists");
  }

  if (input.status === "scheduled" && !input.scheduledAt) {
    throw new Error("Scheduled posts require a publish date");
  }

  const ref = db.collection(COLLECTION).doc();
  const timestamp = now();
  const publishFields = resolvePublishFields(
    input.status,
    input.scheduledAt,
    null,
    timestamp
  );

  const post: BlogPost = {
    id: ref.id,
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() ?? "",
    content: input.content,
    contentFormat: "tiptap_json",
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
  };

  await ref.set(post);
  return post;
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
    if (nextSlug !== existing.slug && (await slugExists(nextSlug, id))) {
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

  const patch: Record<string, unknown> = {
    updatedAt: timestamp,
    publishedAt: publishFields.publishedAt,
    scheduledAt: publishFields.scheduledAt,
  };

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.slug !== undefined) patch.slug = nextSlug;
  if (input.excerpt !== undefined) patch.excerpt = input.excerpt.trim();
  if (input.content !== undefined) patch.content = input.content;
  if (input.coverImage !== undefined) patch.coverImage = input.coverImage.trim();
  if (input.tags !== undefined) patch.tags = normalizeTags(input.tags);
  if (input.seoTitle !== undefined) patch.seoTitle = input.seoTitle.trim();
  if (input.seoDescription !== undefined) {
    patch.seoDescription = input.seoDescription.trim();
  }
  if (input.status !== undefined) patch.status = input.status;

  await getAdminFirestore().collection(COLLECTION).doc(id).update(patch);

  const updated = await getBlogPostById(id);
  if (!updated) throw new Error("Blog post not found after update");
  return updated;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const existing = await getBlogPostById(id);
  if (!existing) throw new Error("Blog post not found");
  await getAdminFirestore().collection(COLLECTION).doc(id).delete();
}
