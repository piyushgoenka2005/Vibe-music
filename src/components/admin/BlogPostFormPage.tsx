"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { slugify } from "@/lib/slug";
import { ROUTES } from "@/lib/routes";
import { EMPTY_BLOG_CONTENT } from "@/lib/blog/editor";
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
}

export default function BlogPostFormPage({ postId }: BlogPostFormPageProps) {
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
        <div className="admin-form-grid">
          <div className="admin-form-group admin-form-grid--full">
            <label>Title *</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label>Slug</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={slugify(form.title) || "post-slug"}
            />
          </div>
          <div className="admin-form-group">
            <label>Status</label>
            <select
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
              <label>Publish at *</label>
              <input
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
            <label>Excerpt</label>
            <textarea
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
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Content *</label>
            <TipTapEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Tags</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="studio, guitars, recording"
            />
          </div>
          <div className="admin-form-group">
            <label>SEO title</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              placeholder={form.title || "Defaults to post title"}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>SEO description</label>
            <textarea
              className="admin-textarea"
              value={form.seoDescription}
              onChange={(e) =>
                setForm({ ...form, seoDescription: e.target.value })
              }
              rows={2}
              placeholder={form.excerpt || "Defaults to excerpt"}
            />
          </div>
        </div>
        {error ? <p className="admin-form-error">{error}</p> : null}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Saving…" : postId ? "Update Post" : "Create Post"}
          </button>
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
