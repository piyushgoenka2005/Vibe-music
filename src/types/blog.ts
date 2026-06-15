export type BlogPostStatus = "draft" | "published" | "scheduled";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentFormat: "tiptap_json";
  coverImage: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  status: BlogPostStatus;
  authorId: string;
  authorName: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPostInput {
  slug?: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  status: BlogPostStatus;
  authorId: string;
  authorName: string;
  scheduledAt?: string | null;
}

export type UpdateBlogPostInput = Partial<
  Omit<CreateBlogPostInput, "authorId" | "authorName">
>;

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  tags: string[];
  authorName: string;
  publishedAt: string | null;
  status: BlogPostStatus;
}
