"use client";

import { use } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import BlogPostFormPage from "@/components/admin/BlogPostFormPage";
import { getAdminCapabilities } from "@/lib/auth/adminCapabilities";

export default function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AdminGuard>
      {(admin) => {
        const caps = getAdminCapabilities(admin.permissions);
        return (
          <AdminShell admin={admin} title="Edit Blog Post">
            <BlogPostFormPage postId={id} readOnly={!caps.blogWrite} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
