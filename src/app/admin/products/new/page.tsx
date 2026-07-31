"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import ProductFormPage from "@/components/admin/ProductFormPage";
import { getAdminCapabilities } from "@/lib/auth/adminCapabilities";

export default function AdminProductNewPage() {
  return (
    <AdminGuard>
      {(admin) => {
        const caps = getAdminCapabilities(admin.permissions);
        return (
          <AdminShell admin={admin} title="New Product">
            <ProductFormPage readOnly={!caps.productsWrite} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
