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
  StatCard,
  StatusBadge,
  formatDate,
} from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import { ROUTES } from "@/lib/routes";
import { getAdminCapabilities } from "@/lib/auth/adminCapabilities";
import type { BlogAnalyticsSummary, BlogComment, BlogPost } from "@/types/blog";

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
      return adminFetchJson<{ analytics: BlogAnalyticsSummary }>("/api/admin/blog/analytics");
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
    <>
      <div className="admin-stat-grid">
        <StatCard label="Total views" value={analytics?.totalViews ?? 0} />
        <StatCard label="Total shares" value={analytics?.totalShares ?? 0} />
        <StatCard label="Total comments" value={analytics?.totalComments ?? 0} />
        <StatCard label="Pending comments" value={analytics?.pendingComments ?? 0} />
      </div>
      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Top posts</h2>
        </div>
        <div className="admin-panel__body">
          {analytics?.topPosts?.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Post</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topPosts.map(
                    (post: { title: string; slug: string; views: number }) => (
                      <tr key={post.slug}>
                        <td>
                          <Link href={`${ROUTES.blog}/${post.slug}`}>{post.title}</Link>
                        </td>
                        <td>{post.views}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No blog views recorded yet." />
          )}
        </div>
      </div>
    </>
  );
}

type CommentStatusFilter = "all" | "pending" | "approved" | "rejected";

function BlogCommentsPanel({ blogWrite }: { blogWrite: boolean }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<CommentStatusFilter>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog-comments-list"],
    queryFn: async () => {
      return adminFetchJson<{ comments: BlogComment[] }>("/api/admin/blog/comments");
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BlogComment["status"] }) => {
      await adminMutateJson(`/api/admin/blog/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-blog-comments-list"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-blog-analytics"] });
    },
  });

  if (isLoading) return <LoadingState message="Loading comments…" />;

  const comments = data?.comments ?? [];
  const filtered =
    statusFilter === "all"
      ? comments
      : comments.filter((comment) => comment.status === statusFilter);

  return (
    <div className="admin-panel">
      <div className="admin-toolbar" style={{ padding: "0.75rem 1rem" }}>
        {(["all", "pending", "approved", "rejected"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`admin-btn ${statusFilter === value ? "admin-btn--primary" : "admin-btn--secondary"}`}
            onClick={() => setStatusFilter(value)}
          >
            {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <div className="admin-panel__body">
        {filtered.length === 0 ? (
          <EmptyState message="No comments match this filter." />
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
                {filtered.map((comment) => (
                  <tr key={comment.id}>
                    <td>{comment.authorName}</td>
                    <td>{comment.body}</td>
                    <td>{comment.status}</td>
                    <td>
                      {blogWrite && comment.status !== "approved" ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          onClick={() =>
                            moderateMutation.mutate({ id: comment.id, status: "approved" })
                          }
                        >
                          Approve
                        </button>
                      ) : null}
                      {blogWrite && comment.status !== "rejected" ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() =>
                            moderateMutation.mutate({ id: comment.id, status: "rejected" })
                          }
                        >
                          Reject
                        </button>
                      ) : null}
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

function BlogListContent({ blogWrite, blogDelete }: { blogWrite: boolean; blogDelete: boolean }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      return adminFetchJson<{ posts: BlogPost[] }>("/api/admin/blog");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminMutateJson(`/api/admin/blog/${id}`, { method: "DELETE" });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const posts = data?.posts ?? [];

  if (isError) {
    return (
      <ErrorState
        message="Unable to load blog posts."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2 className="admin-panel__title">Blog Posts</h2>
        {blogWrite ? (
          <Link href={`${ROUTES.adminBlog}/new`} className="admin-btn admin-btn--primary">
            <Plus size={16} />
            New Post
          </Link>
        ) : null}
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
                        {post.status === "published" ||
                        (post.status === "scheduled" &&
                          post.scheduledAt &&
                          new Date(post.scheduledAt) <= new Date()) ? (
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
                        {blogWrite ? (
                          <Link
                            href={`${ROUTES.adminBlog}/${post.id}`}
                            className="admin-btn admin-btn--ghost admin-btn--icon"
                            aria-label="Edit post"
                          >
                            <Pencil size={14} />
                          </Link>
                        ) : null}
                        {blogDelete ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--icon"
                            aria-label="Delete post"
                            onClick={() => {
                              if (
                                window.confirm(`Delete "${post.title}"? This cannot be undone.`)
                              ) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
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

function BlogAdminTabs({ blogWrite, blogDelete }: { blogWrite: boolean; blogDelete: boolean }) {
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
      {tab === "posts" ? <BlogListContent blogWrite={blogWrite} blogDelete={blogDelete} /> : null}
      {tab === "analytics" ? <BlogAnalyticsPanel /> : null}
      {tab === "comments" ? <BlogCommentsPanel blogWrite={blogWrite} /> : null}
    </>
  );
}

export default function AdminBlogPage() {
  return (
    <AdminGuard>
      {(admin) => {
        const caps = getAdminCapabilities(admin.permissions);
        return (
          <AdminShell admin={admin} title="Blog">
            <BlogAdminTabs blogWrite={caps.blogWrite} blogDelete={caps.blogDelete} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
