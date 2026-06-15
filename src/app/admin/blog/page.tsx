"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import {
  EmptyState,
  LoadingState,
  StatusBadge,
  formatDate,
} from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";
import type { BlogPost } from "@/types/blog";

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
                    <td>{post.authorName}</td>
                    <td>{formatDate(post.updatedAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
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

export default function AdminBlogPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Blog">
          <BlogListContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
