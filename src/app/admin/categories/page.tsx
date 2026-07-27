"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState } from "@/components/admin/AdminUi";
import type { AdminCategory } from "@/types/admin";

function CategoriesContent({
  canWrite,
  canDelete,
}: {
  canWrite: boolean;
  canDelete: boolean;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ categories: AdminCategory[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editId ? `/api/admin/categories/${editId}` : "/api/admin/categories";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", slug: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  if (isLoading) return <LoadingState />;

  const categories = data?.categories ?? [];

  return (
    <>
      <div className="admin-toolbar">
        {canWrite ? (
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", slug: "", description: "" }); }}>
          Add Category
        </button>
        ) : null}
      </div>

      {showForm ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Name</label>
                <input className="admin-input" style={{ width: "100%" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Slug</label>
                <input className="admin-input" style={{ width: "100%" }} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="admin-form-group admin-form-grid--full">
                <label>Description</label>
                <textarea className="admin-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => saveMutation.mutate()}>{editId ? "Update" : "Create"}</button>
              <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-panel">
        {categories.length === 0 ? (
          <EmptyState message="No categories." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td>{cat.slug}</td>
                    <td>{cat.productCount ?? 0}</td>
                    <td>
                      {canWrite ? (
                      <button type="button" className="admin-btn admin-btn--ghost" style={{ padding: "0.25rem 0.5rem" }} onClick={() => { setEditId(cat.id); setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "" }); setShowForm(true); }}>Edit</button>
                      ) : null}
                      {canDelete ? (
                      <button type="button" className="admin-btn admin-btn--danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => deleteMutation.mutate(cat.id)}>Delete</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Categories">
          <CategoriesContent
            canWrite={admin.permissions.includes("categories:write")}
            canDelete={admin.permissions.includes("categories:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
