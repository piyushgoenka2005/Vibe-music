"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import type { Coupon } from "@/types/admin";

function CouponsContent({
  canWrite,
  canDelete,
}: {
  canWrite: boolean;
  canDelete: boolean;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    label: "",
    type: "percentage" as "percentage" | "flat",
    value: 10,
    isActive: true,
    maxUses: undefined as number | undefined,
    expiresAt: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } =
    useAdminCursorPagination();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-coupons", cursor],
    queryFn: async () => {
      const url = `/api/admin/coupons?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        coupons: Coupon[];
        hasMore: boolean;
        nextCursor?: string;
        total: number;
      }>;
    },
  });
  const hasMore = data?.hasMore ?? false;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, expiresAt: form.expiresAt || undefined };
      const url = editId ? `/api/admin/coupons/${editId}` : "/api/admin/coupons";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      setShowForm(false);
      setEditId(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
    },
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load coupons."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      <div className="admin-toolbar">
        {canWrite ? (
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowForm(true)}>Add Coupon</button>
        ) : null}
      </div>
      {deleteMutation.isError ? (
        <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
          <p className="admin-error__message">
            {(deleteMutation.error as Error).message || "Delete failed"}
          </p>
        </div>
      ) : null}
      {showForm ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              <div className="admin-form-group"><label>Code</label><input className="admin-input" style={{ width: "100%" }} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
              <div className="admin-form-group"><label>Label</label><input className="admin-input" style={{ width: "100%" }} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
              <div className="admin-form-group"><label>Type</label><select className="admin-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "flat" })}><option value="percentage">Percentage</option><option value="flat">Flat</option></select></div>
              <div className="admin-form-group"><label>Value</label><input className="admin-input" style={{ width: "100%" }} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
              <div className="admin-form-group"><label>Max Uses</label><input className="admin-input" style={{ width: "100%" }} type="number" value={form.maxUses ?? ""} onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : undefined })} /></div>
              <div className="admin-form-group"><label>Expires At</label><input className="admin-input" style={{ width: "100%" }} type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => saveMutation.mutate()}>Save</button>
              <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="admin-panel">
        {(data?.coupons ?? []).length === 0 ? (
          <EmptyState message="No coupons." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {(data?.coupons ?? []).map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.code}</strong></td>
                    <td>{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}</td>
                    <td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                    <td><StatusBadge status={c.isActive ? "active" : "archived"} /></td>
                    <td>
                      {canWrite ? (
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { setEditId(c.id); setForm({ code: c.code, label: c.label, type: c.type, value: c.value, isActive: c.isActive, maxUses: c.maxUses, expiresAt: c.expiresAt?.slice(0, 10) ?? "" }); setShowForm(true); }}>Edit</button>
                      ) : null}
                      {canDelete ? (
                      <button type="button" className="admin-btn admin-btn--danger" onClick={() => deleteMutation.mutate(c.id)}>Delete</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
          }}
        >
          <span style={{ color: "var(--admin-muted)", fontSize: "0.85rem" }}>
            Page {pageIndex + 1}
            {typeof data?.total === "number" ? ` · ${data.total} total` : ""}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!canGoPrev || isFetching}
              onClick={goPrev}
            >
              Previous
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!hasMore || isFetching}
              onClick={() => goNext(data?.nextCursor)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminCouponsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Coupons">
          <CouponsContent
            canWrite={admin.permissions.includes("coupons:write")}
            canDelete={admin.permissions.includes("coupons:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
