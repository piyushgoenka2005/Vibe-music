import { describe, expect, it } from "vitest";
import {
  computeReadingMinutes,
  matchesBlogSearch,
  paginateBlogPosts,
  resolveCategoryLabel,
  scoreRelatedPosts,
  validateBlogCommentInput,
} from "@/lib/blog/blogEngine";
import type { BlogPostSummary } from "@/types/blog";

const samplePosts: BlogPostSummary[] = [
  {
    id: "1",
    slug: "studio-guide",
    title: "Home Studio Essentials",
    excerpt: "Build your first studio",
    coverImage: "",
    tags: ["Studio", "Recording"],
    categorySlug: "studio",
    categoryLabel: "Studio",
    featured: true,
    authorName: "Team",
    publishedAt: "2026-07-01T00:00:00.000Z",
    status: "published",
  },
  {
    id: "2",
    slug: "guitar-guide",
    title: "First Electric Guitar",
    excerpt: "Pickups and body styles",
    coverImage: "",
    tags: ["Guitars", "Beginner"],
    categorySlug: "guitars",
    categoryLabel: "Guitars",
    featured: false,
    authorName: "Team",
    publishedAt: "2026-06-20T00:00:00.000Z",
    status: "published",
  },
  {
    id: "3",
    slug: "live-sound",
    title: "Live Sound Checklist",
    excerpt: "Small venue PA tips",
    coverImage: "",
    tags: ["Live sound"],
    categorySlug: "live-sound",
    categoryLabel: "Live Sound",
    featured: false,
    authorName: "Team",
    publishedAt: "2026-06-10T00:00:00.000Z",
    status: "published",
  },
];

describe("blogEngine", () => {
  it("resolves category labels", () => {
    expect(resolveCategoryLabel("studio")).toBe("Studio");
    expect(resolveCategoryLabel("unknown")).toBe("unknown");
  });

  it("computes reading minutes from tiptap json", () => {
    const content = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "word ".repeat(400) }],
        },
      ],
    });
    expect(computeReadingMinutes(content)).toBeGreaterThanOrEqual(2);
  });

  it("matches blog search query", () => {
    expect(matchesBlogSearch(samplePosts[0], "studio")).toBe(true);
    expect(matchesBlogSearch(samplePosts[0], "drums")).toBe(false);
  });

  it("scores related posts by category and tags", () => {
    const related = scoreRelatedPosts(
      {
        id: "1",
        slug: "studio-guide",
        tags: ["Studio", "Recording"],
        categorySlug: "studio",
      },
      samplePosts,
      2
    );
    expect(related).toHaveLength(0);
    const relatedFromGuitar = scoreRelatedPosts(
      {
        id: "2",
        slug: "guitar-guide",
        tags: ["Guitars"],
        categorySlug: "guitars",
      },
      samplePosts,
      2
    );
    expect(relatedFromGuitar.every((p) => p.id !== "2")).toBe(true);
  });

  it("paginates blog posts", () => {
    const page = paginateBlogPosts(samplePosts, 1, 2);
    expect(page.items).toHaveLength(2);
    expect(page.totalPages).toBe(2);
  });

  it("validates blog comments and rejects honeypot", () => {
    expect(validateBlogCommentInput({ website: "spam" })).toBe("Comment rejected");
    const valid = validateBlogCommentInput({
      authorName: "Alex",
      email: "alex@example.com",
      body: "Great article, thanks for the tips!",
    });
    expect(typeof valid).toBe("object");
  });
});
