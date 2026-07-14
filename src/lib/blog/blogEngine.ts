import type { BlogPost, BlogPostSummary } from "@/types/blog";

export const BLOG_CATEGORIES = [
  { slug: "studio", label: "Studio" },
  { slug: "guitars", label: "Guitars" },
  { slug: "live-sound", label: "Live Sound" },
  { slug: "buying-guides", label: "Buying Guides" },
  { slug: "news", label: "News" },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

export const BLOG_PAGE_SIZE = 9;

export function resolveCategoryLabel(slug: string): string {
  return BLOG_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function computeReadingMinutes(content: string): number {
  const plain = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) {
    try {
      const json = JSON.parse(content) as { content?: unknown[] };
      const text = JSON.stringify(json.content ?? []).replace(/[^\w\s]/g, " ");
      const words = text.split(/\s+/).filter(Boolean).length;
      return Math.max(1, Math.ceil(words / 200));
    } catch {
      return 1;
    }
  }
  return Math.max(1, Math.ceil(plain.split(/\s+/).length / 200));
}

export function matchesBlogSearch(post: BlogPostSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    post.title,
    post.excerpt,
    post.authorName,
    post.categoryLabel,
    ...post.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function scoreRelatedPosts(
  source: Pick<BlogPost, "id" | "slug" | "tags" | "categorySlug">,
  candidates: BlogPostSummary[],
  limit = 3
): BlogPostSummary[] {
  const sourceTags = new Set(source.tags.map((t) => t.toLowerCase()));

  return candidates
    .filter((post) => post.id !== source.id && post.slug !== source.slug)
    .map((post) => {
      let score = 0;
      if (post.categorySlug && post.categorySlug === source.categorySlug) {
        score += 3;
      }
      for (const tag of post.tags) {
        if (sourceTags.has(tag.toLowerCase())) score += 2;
      }
      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.post.publishedAt ?? "").localeCompare(a.post.publishedAt ?? ""))
    .slice(0, limit)
    .map(({ post }) => post);
}

export function paginateBlogPosts<T>(
  items: T[],
  page: number,
  pageSize = BLOG_PAGE_SIZE
): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const safePage = Math.max(1, page);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function validateBlogCommentInput(input: {
  authorName?: string;
  email?: string;
  body?: string;
  website?: string;
}): { authorName: string; email: string; body: string } | string {
  if (input.website?.trim()) {
    return "Comment rejected";
  }
  const authorName = input.authorName?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  if (authorName.length < 2 || authorName.length > 80) {
    return "Enter a valid name";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email";
  }
  if (body.length < 10 || body.length > 2000) {
    return "Comment must be between 10 and 2000 characters";
  }
  return { authorName, email, body };
}

export function buildShareUrls(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };
}
