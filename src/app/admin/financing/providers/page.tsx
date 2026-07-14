"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState } from "@/components/admin/AdminUi";

function ProvidersAdmin() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance-providers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/finance/providers");
      return res.json();
    },
  });
  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/finance/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, type: "bank" }),
      });
    },
    onSuccess: () => {
      setName("");
      setSlug("");
      queryClient.invalidateQueries({ queryKey: ["admin-finance-providers"] });
    },
  });
  if (isLoading) return <LoadingState />;
  return (
    <>
      <div className="admin-panel" style={{ marginBottom: "1rem" }}>
        <div className="admin-panel__body admin-form-grid">
          <input className="admin-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="admin-input" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => saveMutation.mutate()}>Add provider</button>
        </div>
      </div>
      <div className="admin-panel">
        {(data?.providers ?? []).length === 0 ? <EmptyState message="No providers." /> : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Status</th></tr></thead>
            <tbody>
              {(data?.providers ?? []).map((p: { id: string; name: string; slug: string; status: string }) => (
                <tr key={p.id}><td>{p.name}</td><td>{p.slug}</td><td>{p.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function AdminFinanceProvidersPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Finance providers">
          <ProvidersAdmin />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
