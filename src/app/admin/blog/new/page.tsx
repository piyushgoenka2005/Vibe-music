"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import BlogPostFormPage from "@/components/admin/BlogPostFormPage";
import { getAdminCapabilities } from "@/lib/auth/adminCapabilities";

export default function AdminBlogNewPage() {
  return (
    <AdminGuard>
      {(admin) => {
        const caps = getAdminCapabilities(admin.permissions);
        return (
          <AdminShell admin={admin} title="New Blog Post">
            <BlogPostFormPage readOnly={!caps.blogWrite} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
