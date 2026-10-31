"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import {
  ErrorState,
  MutationError,
  adminFetchJson,
  adminMutateJson,
} from "@/components/admin/AdminQueryState";
import type { AdminCategory } from "@/types/admin";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  imageUrl: string;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
};

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  parentId: null,
  imageUrl: "",
  isFeatured: false,
  sortOrder: 0,
  metaTitle: "",
  metaDescription: "",
};

function CategoriesContent({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "main" | "sub">("all");
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-categories"],
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      return adminFetchJson<{ categories: AdminCategory[] }>("/api/admin/categories");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editId ? `/api/admin/categories/${editId}` : "/api/admin/categories";
      await adminMutateJson(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl.trim() || undefined,
          metaTitle: form.metaTitle.trim() || undefined,
          metaDescription: form.metaDescription.trim() || undefined,
        }),
      });
    },
    onSuccess: () => {
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      await adminMutateJson(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      try {
        await adminMutateJson(`/api/admin/categories/${id}`, { method: "DELETE" });
      } finally {
        setDeletingId(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      await adminMutateJson("/api/admin/categories/seed", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  if (isLoading) return <LoadingState />;

  const categories = data?.categories ?? [];

  // Only show ErrorState when there is an actual fetch failure AND we have no data at all.
  // An empty list (0 categories) is a valid state — show the empty-state UI instead.
  if (isError && !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load categories."}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }
  const mainCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => Boolean(c.parentId));

  const filteredCategories =
    filterType === "main" ? mainCategories : filterType === "sub" ? subCategories : categories;

  const getParentName = (parentId: string | null | undefined) => {
    if (!parentId) return null;
    return categories.find((c) => c.id === parentId)?.name ?? "Parent";
  };

  const handleDelete = (cat: AdminCategory) => {
    const isParent = categories.some((c) => c.parentId === cat.id);
    const message = isParent
      ? `Are you sure you want to delete "${cat.name}" and all of its subcategories? This cannot be undone.`
      : `Are you sure you want to delete "${cat.name}"? This cannot be undone.`;

    if (window.confirm(message)) {
      deleteMutation.mutate(cat.id);
    }
  };

  const handleAddSubcategory = (parentId: string) => {
    setEditId(null);
    setForm({
      ...EMPTY_FORM,
      parentId,
    });
    setShowForm(true);
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
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {categories.length === 0 ? (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={seedMutation.isPending}
                onClick={() => seedMutation.mutate()}
              >
                {seedMutation.isPending ? "Restoring Defaults…" : "Restore Default Categories"}
              </button>
            ) : null}
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => {
                setShowForm(true);
                setEditId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Add Category / Subcategory
            </button>
          </div>
        ) : null}
      </div>

      {deleteMutation.isError ? (
        <div
          className="admin-panel"
          style={{ marginBottom: "1rem", borderColor: "var(--color-danger, #ef4444)" }}
        >
          <div className="admin-panel__body">
            <MutationError error={deleteMutation.error} fallback="Failed to delete category." />
          </div>
        </div>
      ) : null}

      {showForm ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__header">
            <h3>{editId ? "Edit Category" : "Add Category / Subcategory"}</h3>
          </div>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Name *</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Guitars or Electric Guitar"
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
                  placeholder="Leave empty to auto-generate from name"
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

              <div className="admin-form-group">
                <label>Image URL</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://… or /images/…"
                />
              </div>

              <div className="admin-form-group">
                <label>Sort order</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
                />
              </div>

              <div
                className="admin-form-group"
                style={{ display: "flex", alignItems: "center", paddingTop: "1.5rem" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  <span>Featured (Display in Popular Categories on homepage)</span>
                </label>
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

              <div className="admin-form-group">
                <label>Meta title</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Meta description</label>
                <textarea
                  className="admin-textarea"
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                />
              </div>
            </div>

            <MutationError error={saveMutation.error} fallback="Failed to save category." />

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => saveMutation.mutate()}
                disabled={!form.name.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? editId
                    ? "Updating…"
                    : "Creating…"
                  : editId
                    ? "Update Category"
                    : "Create Category"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={saveMutation.isPending}
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-panel">
        {filteredCategories.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p style={{ margin: "0 0 1rem", color: "#666" }}>
              {categories.length === 0
                ? "No categories exist yet. You can create your first category above or restore default categories."
                : "No categories found for this filter."}
            </p>
            {canWrite && categories.length === 0 ? (
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={() => {
                    setShowForm(true);
                    setEditId(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  Add your first category
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={seedMutation.isPending}
                  onClick={() => seedMutation.mutate()}
                >
                  {seedMutation.isPending ? "Restoring Defaults…" : "Restore Defaults"}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type / Parent</th>
                  <th>Slug</th>
                  <th>Featured</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => {
                  const parentName = getParentName(cat.parentId);
                  const isMain = !cat.parentId;
                  const isDeleting = deletingId === cat.id;

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
                      <td>
                        {canWrite ? (
                          <button
                            type="button"
                            className={`admin-btn ${cat.isFeatured ? "admin-btn--primary" : "admin-btn--secondary"}`}
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                            disabled={toggleFeaturedMutation.isPending}
                            title="Click to toggle featured status on storefront"
                            onClick={() =>
                              toggleFeaturedMutation.mutate({
                                id: cat.id,
                                isFeatured: !cat.isFeatured,
                              })
                            }
                          >
                            {cat.isFeatured ? "★ Featured" : "☆ Standard"}
                          </button>
                        ) : (
                          <span>{cat.isFeatured ? "Yes" : "—"}</span>
                        )}
                      </td>
                      <td>{cat.productCount ?? 0}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                          {canWrite && isMain ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                              title={`Add subcategory under ${cat.name}`}
                              onClick={() => handleAddSubcategory(cat.id)}
                            >
                              + Subcategory
                            </button>
                          ) : null}
                          {canWrite ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                              onClick={() => {
                                setEditId(cat.id);
                                setForm({
                                  name: cat.name,
                                  slug: cat.slug,
                                  description: cat.description ?? "",
                                  parentId: cat.parentId ?? null,
                                  imageUrl: cat.imageUrl ?? "",
                                  isFeatured: cat.isFeatured ?? false,
                                  sortOrder: cat.sortOrder ?? 0,
                                  metaTitle: cat.metaTitle ?? "",
                                  metaDescription: cat.metaDescription ?? "",
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
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                              disabled={isDeleting || deleteMutation.isPending}
                              onClick={() => handleDelete(cat)}
                            >
                              {isDeleting ? "Deleting…" : "Delete"}
                            </button>
                          ) : null}
                        </div>
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
            canWrite={
              admin.role === "super_admin" || admin.permissions.includes("categories:write")
            }
            canDelete={
              admin.role === "super_admin" || admin.permissions.includes("categories:delete")
            }
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
