"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/admin/AdminUi";

export default function AdminBlogPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Blog">
          <div className="admin-panel">
            <EmptyState message="Blog CMS is planned for a future release. Use Settings to configure store content in the meantime." />
          </div>
        </AdminShell>
      )}
    </AdminGuard>
  );
}
