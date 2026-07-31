"use client";

import { use } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import ProductFormPage from "@/components/admin/ProductFormPage";
import { getAdminCapabilities } from "@/lib/auth/adminCapabilities";

export default function AdminProductEditPage({
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
          <AdminShell admin={admin} title="Edit Product">
            <ProductFormPage productId={id} readOnly={!caps.productsWrite} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
