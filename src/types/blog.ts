export type BlogPostStatus = "draft" | "published" | "scheduled";
export type BlogCommentStatus = "pending" | "approved" | "rejected";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentFormat: "tiptap_json";
  coverImage: string;
  tags: string[];
  categorySlug: string;
  categoryLabel: string;
  featured: boolean;
  authorBio: string;
  authorAvatar: string;
  viewCount: number;
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
  categorySlug?: string;
  categoryLabel?: string;
  featured?: boolean;
  authorBio?: string;
  authorAvatar?: string;
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
  categorySlug: string;
  categoryLabel: string;
  featured: boolean;
  authorName: string;
  publishedAt: string | null;
  status: BlogPostStatus;
  readingMinutes?: number;
}

export interface BlogComment {
  id: string;
  postId: string;
  authorName: string;
  email: string;
  body: string;
  status: BlogCommentStatus;
  createdAt: string;
}

export interface BlogListQuery {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
  featured?: boolean;
}

export interface BlogListResult {
  posts: BlogPostSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BlogAnalyticsSummary {
  totalViews: number;
  totalShares: number;
  totalComments: number;
  pendingComments: number;
  topPosts: Array<{ postId: string; title: string; slug: string; views: number }>;
  recentEvents: Array<{ type: string; postId: string | null; createdAt: string }>;
}
