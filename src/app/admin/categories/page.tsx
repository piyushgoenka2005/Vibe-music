"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import type { AdminCategory } from "@/types/admin";

function CategoriesContent({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "main" | "sub">("all");
  const [form, setForm] = useState<{
    name: string;
    slug: string;
    description: string;
    parentId: string | null;
  }>({
    name: "",
    slug: "",
    description: "",
    parentId: null,
  });
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
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
      setForm({ name: "", slug: "", description: "", parentId: null });
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
  if (isError) {
    return (
      <ErrorState
        message="Unable to load categories."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const categories = data?.categories ?? [];
  const mainCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => Boolean(c.parentId));

  const filteredCategories =
    filterType === "main" ? mainCategories : filterType === "sub" ? subCategories : categories;

  const getParentName = (parentId: string | null | undefined) => {
    if (!parentId) return null;
    return categories.find((c) => c.id === parentId)?.name ?? "Parent";
  };

  return (
    <>
      <div
        className="admin-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={`admin-btn ${filterType === "all" ? "admin-btn--primary" : "admin-btn--secondary"}`}
            onClick={() => setFilterType("all")}
          >
            All ({categories.length})
          </button>
          <button
            type="button"
            className={`admin-btn ${filterType === "main" ? "admin-btn--primary" : "admin-btn--secondary"}`}
            onClick={() => setFilterType("main")}
          >
            Main Categories ({mainCategories.length})
          </button>
          <button
            type="button"
            className={`admin-btn ${filterType === "sub" ? "admin-btn--primary" : "admin-btn--secondary"}`}
            onClick={() => setFilterType("sub")}
          >
            Subcategories ({subCategories.length})
          </button>
        </div>

        {canWrite ? (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm({ name: "", slug: "", description: "", parentId: null });
            }}
          >
            Add Category / Subcategory
          </button>
        ) : null}
      </div>

      {showForm ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Name *</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Guitars or Electric Guitars"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Slug</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                />
              </div>

              <div className="admin-form-group">
                <label>Parent Category (Select if this is a Subcategory)</label>
                <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={form.parentId ?? ""}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
                >
                  <option value="">None (Top-Level Main Category)</option>
                  {mainCategories
                    .filter((c) => c.id !== editId)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="admin-form-group admin-form-grid--full">
                <label>Description</label>
                <textarea
                  className="admin-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional category description"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => saveMutation.mutate()}
                disabled={!form.name.trim()}
              >
                {editId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-panel">
        {filteredCategories.length === 0 ? (
          <EmptyState message="No categories found for this filter." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type / Parent</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => {
                  const parentName = getParentName(cat.parentId);
                  return (
                    <tr key={cat.id}>
                      <td>
                        <strong>{cat.name}</strong>
                      </td>
                      <td>
                        {parentName ? (
                          <span className="admin-badge admin-badge--neutral">
                            Subcategory of {parentName}
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge--primary">Main Category</span>
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: "0.8rem" }}>{cat.slug}</code>
                      </td>
                      <td>{cat.productCount ?? 0}</td>
                      <td>
                        {canWrite ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            style={{ padding: "0.25rem 0.5rem" }}
                            onClick={() => {
                              setEditId(cat.id);
                              setForm({
                                name: cat.name,
                                slug: cat.slug,
                                description: cat.description ?? "",
                                parentId: cat.parentId ?? null,
                              });
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger"
                            style={{ padding: "0.25rem 0.5rem" }}
                            onClick={() => deleteMutation.mutate(cat.id)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
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
        <AdminShell admin={admin} title="Categories & Subcategories">
          <CategoriesContent
            canWrite={admin.permissions.includes("categories:write")}
            canDelete={admin.permissions.includes("categories:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
