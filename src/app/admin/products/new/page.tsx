"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import ProductFormPage from "@/components/admin/ProductFormPage";

export default function AdminProductNewPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="New Product">
          <ProductFormPage />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
