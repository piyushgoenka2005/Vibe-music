"use client";

import { use } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import ProductFormPage from "@/components/admin/ProductFormPage";

export default function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Edit Product">
          <ProductFormPage productId={id} />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
