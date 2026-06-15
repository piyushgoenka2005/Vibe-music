"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import BlogPostFormPage from "@/components/admin/BlogPostFormPage";

export default function AdminBlogNewPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="New Blog Post">
          <BlogPostFormPage />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
