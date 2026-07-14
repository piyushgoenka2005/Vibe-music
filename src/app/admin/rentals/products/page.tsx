"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState } from "@/components/admin/AdminUi";
import type { RentalProduct } from "@/types/rental";

function ProductsAdmin() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    categoryId: "",
    dailyRate: 500,
    depositAmount: 2000,
    totalUnits: 2,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-rental-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/categories");
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-rental-products"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/products");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ products: RentalProduct[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/rentals/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-rental-products"] });
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <>
      <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowForm(true)}>
        Add rental product
      </button>
      {showForm ? (
        <div className="admin-panel" style={{ margin: "1rem 0" }}>
          <div className="admin-panel__body admin-form-grid">
            <input className="admin-input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="admin-input" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <select className="admin-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Category</option>
              {(categoriesData?.categories ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input className="admin-input" type="number" placeholder="Daily rate" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })} />
            <input className="admin-input" type="number" placeholder="Deposit" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} />
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => saveMutation.mutate()}>Save</button>
          </div>
        </div>
      ) : null}
      <div className="admin-panel">
        {(data?.products ?? []).length === 0 ? (
          <EmptyState message="No rental products." />
        ) : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Status</th><th>Units</th><th>Daily</th></tr></thead>
            <tbody>
              {(data?.products ?? []).map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.status}</td>
                  <td>{p.totalUnits}</td>
                  <td>₹{p.dailyRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function AdminRentalProductsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Rental products">
          <ProductsAdmin />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
