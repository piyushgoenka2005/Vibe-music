"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import {
  EmptyState,
  LoadingState,
  StatusBadge,
  formatDate,
} from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { ROUTES } from "@/lib/routes";
import type { BlogComment, BlogPost } from "@/types/blog";

const QUERY_KEY = ["admin-blog-posts"] as const;

function scheduleHint(post: BlogPost): string | null {
  if (post.status === "scheduled" && post.scheduledAt) {
    return formatDate(post.scheduledAt);
  }
  if (post.status === "published" && post.publishedAt) {
    return formatDate(post.publishedAt);
  }
  return null;
}

function BlogAnalyticsPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-blog-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blog/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <LoadingState message="Loading analytics…" />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load blog analytics."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }
  const analytics = data?.analytics;

  return (
    <div className="admin-panel">
      <div className="admin-panel__body">
        <p>Total views: {analytics?.totalViews ?? 0}</p>
        <p>Total shares: {analytics?.totalShares ?? 0}</p>
        <p>Total comments: {analytics?.totalComments ?? 0}</p>
        <p>Pending comments: {analytics?.pendingComments ?? 0}</p>
        {analytics?.topPosts?.length ? (
          <>
            <h3 style={{ marginTop: "1rem" }}>Top posts</h3>
            <ul>
              {analytics.topPosts.map(
                (post: { title: string; slug: string; views: number }) => (
                  <li key={post.slug}>
                    {post.title} — {post.views} views
                  </li>
                )
              )}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}

function BlogCommentsPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog-comments-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blog/comments");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ comments: BlogComment[] }>;
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: BlogComment["status"];
    }) => {
      const res = await fetch(`/api/admin/blog/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Moderation failed");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-blog-comments-list"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-blog-analytics"] });
    },
  });

  if (isLoading) return <LoadingState message="Loading comments…" />;

  const comments = data?.comments ?? [];
  const pending = comments.filter((comment) => comment.status === "pending");

  return (
    <div className="admin-panel">
      <div className="admin-panel__body">
        {pending.length === 0 ? (
          <EmptyState message="No comments awaiting moderation." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Comment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((comment) => (
                  <tr key={comment.id}>
                    <td>{comment.authorName}</td>
                    <td>{comment.body}</td>
                    <td>{comment.status}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          onClick={() =>
                            moderateMutation.mutate({ id: comment.id, status: "approved" })
                          }
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() =>
                            moderateMutation.mutate({ id: comment.id, status: "rejected" })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BlogListContent() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/admin/blog");
      if (!res.ok) throw new Error("Failed to load blog posts");
      return res.json() as Promise<{ posts: BlogPost[] }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const posts = data?.posts ?? [];

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2 className="admin-panel__title">Blog Posts</h2>
        <Link href={`${ROUTES.adminBlog}/new`} className="admin-btn admin-btn--primary">
          <Plus size={16} />
          New Post
        </Link>
      </div>
      <div className="admin-panel__body">
        {isLoading ? (
          <LoadingState message="Loading posts…" />
        ) : posts.length === 0 ? (
          <EmptyState message="No blog posts yet. Create your first article to publish on the storefront blog." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{post.title}</div>
                      <div style={{ fontSize: 12, color: "var(--admin-muted)" }}>
                        /blog/{post.slug}
                        {post.featured ? " · Featured" : ""}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={post.status} />
                      {scheduleHint(post) ? (
                        <div style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 4 }}>
                          {scheduleHint(post)}
                        </div>
                      ) : null}
                    </td>
                    <td>{post.categoryLabel || "—"}</td>
                    <td>{post.authorName}</td>
                    <td>{formatDate(post.updatedAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(post.status === "published" ||
                          (post.status === "scheduled" &&
                            post.scheduledAt &&
                            new Date(post.scheduledAt) <= new Date())) ? (
                          <a
                            href={`${ROUTES.blog}/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn admin-btn--ghost admin-btn--icon"
                            aria-label="View live post"
                          >
                            <ExternalLink size={14} />
                          </a>
                        ) : null}
                        <Link
                          href={`${ROUTES.adminBlog}/${post.id}`}
                          className="admin-btn admin-btn--ghost admin-btn--icon"
                          aria-label="Edit post"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--icon"
                          aria-label="Delete post"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${post.title}"? This cannot be undone.`
                              )
                            ) {
                              deleteMutation.mutate(post.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BlogAdminTabs() {
  const [tab, setTab] = useState<"posts" | "analytics" | "comments">("posts");

  return (
    <>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        {(["posts", "analytics", "comments"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`admin-btn ${tab === value ? "admin-btn--primary" : "admin-btn--secondary"}`}
            onClick={() => setTab(value)}
          >
            {value === "posts" ? "Posts" : value === "analytics" ? "Analytics" : "Comments"}
          </button>
        ))}
      </div>
      {tab === "posts" ? <BlogListContent /> : null}
      {tab === "analytics" ? <BlogAnalyticsPanel /> : null}
      {tab === "comments" ? <BlogCommentsPanel /> : null}
    </>
  );
}

export default function AdminBlogPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Blog">
          <BlogAdminTabs />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
