"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { EmptyState, LoadingState, StatusBadge } from "@/components/admin/AdminUi";
import { slugify } from "@/lib/slug";
import type { AdminSession } from "@/types/admin";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
};

type CategoryForm = {
  id?: string;
  name: string;
  slug: string;
  status: "active" | "draft" | "archived";
  description: string;
};

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  status: "active",
  description: "",
};

function CategoriesAdmin({
  canWrite,
  canDelete,
}: {
  canWrite: boolean;
  canDelete: boolean;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-rental-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/categories");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ categories: CategoryRow[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
      };
      const res = await fetch("/api/admin/rentals/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
    },
    onSuccess: () => {
      setShowForm(false);
      setForm(EMPTY_FORM);
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-categories"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rentals/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
    },
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-categories"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message="Unable to load rental categories."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      {canWrite ? (
        <div className="admin-toolbar">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowForm(true);
              setActionError(null);
            }}
          >
            Add category
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
          <p className="admin-error__message">{actionError}</p>
        </div>
      ) : null}

      {showForm ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__body admin-form-grid">
            <input
              className="admin-input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: prev.id ? prev.slug : slugify(name),
                }));
              }}
            />
            <input
              className="admin-input"
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            />
            <select
              className="admin-select"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as CategoryForm["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <textarea
              className="admin-textarea"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving…" : form.id ? "Update" : "Create"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => {
                  setShowForm(false);
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
        {(data?.categories ?? []).length === 0 ? (
          <EmptyState message="No rental categories." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.categories ?? []).map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.slug}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {canWrite ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() => {
                            setForm({
                              id: c.id,
                              name: c.name,
                              slug: c.slug,
                              status: (c.status as CategoryForm["status"]) || "active",
                              description: c.description ?? "",
                            });
                            setShowForm(true);
                            setActionError(null);
                          }}
                        >
                          Edit
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => {
                            if (window.confirm(`Delete category “${c.name}”?`)) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                        >
                          Delete
                        </button>
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

export default function AdminRentalCategoriesPage() {
  return (
    <AdminGuard>
      {(admin: AdminSession) => (
        <AdminShell admin={admin} title="Rental categories">
          <CategoriesAdmin
            canWrite={admin.permissions.includes("rentals:write")}
            canDelete={admin.permissions.includes("rentals:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
