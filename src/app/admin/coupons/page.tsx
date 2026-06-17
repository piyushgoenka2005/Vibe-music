"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import type { Coupon } from "@/types/admin";

function CouponsContent() {
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

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ coupons: Coupon[] }>;
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  if (isLoading) return <LoadingState />;

  return (
    <>
      <div className="admin-toolbar">
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowForm(true)}>Add Coupon</button>
      </div>
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
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { setEditId(c.id); setForm({ code: c.code, label: c.label, type: c.type, value: c.value, isActive: c.isActive, maxUses: c.maxUses, expiresAt: c.expiresAt?.slice(0, 10) ?? "" }); setShowForm(true); }}>Edit</button>
                      <button type="button" className="admin-btn admin-btn--danger" onClick={() => deleteMutation.mutate(c.id)}>Delete</button>
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

export default function AdminCouponsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Coupons">
          <CouponsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
