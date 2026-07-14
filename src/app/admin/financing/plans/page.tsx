"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState } from "@/components/admin/AdminUi";

function PlansAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    providerId: "",
    name: "",
    tenureMonths: 6,
    interestRateAnnual: 0,
    isNoCostEmi: true,
    emiType: "card",
  });
  const { data: providersData } = useQuery({
    queryKey: ["admin-finance-providers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/finance/providers");
      return res.json();
    },
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance-plans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/finance/plans");
      return res.json();
    },
  });
  const saveMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/finance/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-finance-plans"] }),
  });
  if (isLoading) return <LoadingState />;
  return (
    <>
      <div className="admin-panel" style={{ marginBottom: "1rem" }}>
        <div className="admin-panel__body admin-form-grid">
          <select className="admin-select" value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}>
            <option value="">Provider</option>
            {(providersData?.providers ?? []).map((p: { id: string; name: string }) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input className="admin-input" placeholder="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="admin-input" type="number" placeholder="Tenure months" value={form.tenureMonths} onChange={(e) => setForm({ ...form, tenureMonths: Number(e.target.value) })} />
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => saveMutation.mutate()}>Add plan</button>
        </div>
      </div>
      <div className="admin-panel">
        {(data?.plans ?? []).length === 0 ? <EmptyState message="No plans." /> : (
          <table className="admin-table">
            <thead><tr><th>Plan</th><th>Tenure</th><th>Type</th><th>No-cost</th></tr></thead>
            <tbody>
              {(data?.plans ?? []).map((p: { id: string; name: string; tenureMonths: number; emiType: string; isNoCostEmi: boolean }) => (
                <tr key={p.id}><td>{p.name}</td><td>{p.tenureMonths} mo</td><td>{p.emiType}</td><td>{p.isNoCostEmi ? "Yes" : "No"}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function AdminFinancePlansPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Finance plans">
          <PlansAdmin />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
