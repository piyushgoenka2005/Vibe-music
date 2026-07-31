"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { slugify } from "@/lib/slug";
import { ROUTES } from "@/lib/routes";
import { EMPTY_BLOG_CONTENT } from "@/lib/blog/editor";
import { BLOG_CATEGORIES } from "@/lib/blog/blogEngine";
import BlogCoverImageUpload from "@/components/admin/BlogCoverImageUpload";
import TipTapEditor from "@/components/admin/TipTapEditor";
import type { BlogPostStatus } from "@/types/blog";

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: EMPTY_BLOG_CONTENT,
  coverImage: "",
  tags: "",
  categorySlug: "",
  categoryLabel: "",
  featured: false,
  authorBio: "",
  authorAvatar: "",
  seoTitle: "",
  seoDescription: "",
  status: "draft" as BlogPostStatus,
  scheduledAt: "",
};

function toDatetimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

interface BlogPostFormPageProps {
  postId?: string;
  readOnly?: boolean;
}

export default function BlogPostFormPage({
  postId,
  readOnly = false,
}: BlogPostFormPageProps) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!postId);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/admin/blog/${postId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.post) {
          setForm({
            title: d.post.title ?? "",
            slug: d.post.slug ?? "",
            excerpt: d.post.excerpt ?? "",
            content: d.post.content || EMPTY_BLOG_CONTENT,
            coverImage: d.post.coverImage ?? "",
            tags: (d.post.tags ?? []).join(", "),
            categorySlug: d.post.categorySlug ?? "",
            categoryLabel: d.post.categoryLabel ?? "",
            featured: Boolean(d.post.featured),
            authorBio: d.post.authorBio ?? "",
            authorAvatar: d.post.authorAvatar ?? "",
            seoTitle: d.post.seoTitle ?? "",
            seoDescription: d.post.seoDescription ?? "",
            status: d.post.status ?? "draft",
            scheduledAt: toDatetimeLocal(d.post.scheduledAt),
          });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [postId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.slug || slugify(form.title);
      const payload = {
        title: form.title,
        slug,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage || "",
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        categorySlug: form.categorySlug,
        categoryLabel: form.categoryLabel,
        featured: form.featured,
        authorBio: form.authorBio,
        authorAvatar: form.authorAvatar || "",
        seoTitle: form.seoTitle || form.title,
        seoDescription: form.seoDescription || form.excerpt,
        status: form.status,
        scheduledAt:
          form.status === "scheduled"
            ? fromDatetimeLocal(form.scheduledAt)
            : null,
      };

      const url = postId ? `/api/admin/blog/${postId}` : "/api/admin/blog";
      const res = await fetch(url, {
        method: postId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Save failed");
    },
    onSuccess: () => router.push(ROUTES.adminBlog),
    onError: (err) => setError(err instanceof Error ? err.message : "Save failed"),
  });

  if (!loaded) return <div className="admin-loading">Loading post…</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel__body">
        {readOnly ? (
          <p style={{ margin: "0 0 1rem", color: "var(--admin-muted)", fontSize: "0.875rem" }}>
            View-only — you do not have permission to edit blog posts.
          </p>
        ) : null}
        <fieldset
          disabled={readOnly}
          className="admin-form-grid"
          style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}
        >
          <div className="admin-form-group admin-form-grid--full">
            <label htmlFor="blog-form-title">Title *</label>
            <input
              id="blog-form-title"
              className="admin-input"
              style={{ width: "100%" }}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="blog-form-slug">Slug</label>
            <input
              id="blog-form-slug"
              className="admin-input"
              style={{ width: "100%" }}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={slugify(form.title) || "post-slug"}
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="blog-form-status">Status</label>
            <select
              id="blog-form-status"
              className="admin-select"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as BlogPostStatus,
                })
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          {form.status === "scheduled" ? (
            <div className="admin-form-group">
              <label htmlFor="blog-form-scheduled-at">Publish at *</label>
              <input
                id="blog-form-scheduled-at"
                className="admin-input"
                style={{ width: "100%" }}
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) =>
                  setForm({ ...form, scheduledAt: e.target.value })
                }
                required
              />
            </div>
          ) : null}
          <div className="admin-form-group admin-form-grid--full">
            <label htmlFor="blog-form-excerpt">Excerpt</label>
            <textarea
              id="blog-form-excerpt"
              className="admin-textarea"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={3}
              placeholder="Short summary for listings and social previews"
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <BlogCoverImageUpload
              value={form.coverImage}
              onChange={(coverImage) => setForm({ ...form, coverImage })}
              disabled={readOnly}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Content *</label>
            <TipTapEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              readOnly={readOnly}
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="blog-form-category">Category</label>
            <select
              id="blog-form-category"
              className="admin-select"
              value={form.categorySlug}
              onChange={(e) => {
                const categorySlug = e.target.value;
                const categoryLabel =
                  BLOG_CATEGORIES.find((item) => item.slug === categorySlug)?.label ?? "";
                setForm({ ...form, categorySlug, categoryLabel });
              }}
            >
              <option value="">Uncategorized</option>
              {BLOG_CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />{" "}
              Featured article
            </label>
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label htmlFor="blog-form-author-bio">Author bio</label>
            <textarea
              id="blog-form-author-bio"
              className="admin-textarea"
              value={form.authorBio}
              onChange={(e) => setForm({ ...form, authorBio: e.target.value })}
              rows={2}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label htmlFor="blog-form-author-avatar">Author avatar URL</label>
            <input
              id="blog-form-author-avatar"
              className="admin-input"
              style={{ width: "100%" }}
              value={form.authorAvatar}
              onChange={(e) => setForm({ ...form, authorAvatar: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label htmlFor="blog-form-tags">Tags</label>
            <input
              id="blog-form-tags"
              className="admin-input"
              style={{ width: "100%" }}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="studio, guitars, recording"
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="blog-form-seo-title">SEO title</label>
            <input
              id="blog-form-seo-title"
              className="admin-input"
              style={{ width: "100%" }}
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              placeholder={form.title || "Defaults to post title"}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label htmlFor="blog-form-seo-description">SEO description</label>
            <textarea
              id="blog-form-seo-description"
              className="admin-textarea"
              value={form.seoDescription}
              onChange={(e) =>
                setForm({ ...form, seoDescription: e.target.value })
              }
              rows={2}
              placeholder={form.excerpt || "Defaults to excerpt"}
            />
          </div>
        </fieldset>
        {error ? <p className="admin-form-error">{error}</p> : null}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          {!readOnly ? (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : postId ? "Update Post" : "Create Post"}
            </button>
          ) : null}
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => router.push(ROUTES.adminBlog)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
