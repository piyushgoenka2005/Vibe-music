"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState, StatusBadge } from "@/components/admin/AdminUi";

function ApplicationsAdmin() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance-applications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/finance/applications");
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: string; reason?: string }) => {
      const res = await fetch(`/api/admin/finance/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new Error("Action failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-finance-applications"] }),
  });

  if (isLoading) return <LoadingState />;
  const applications = data?.applications ?? [];

  return (
    <div className="admin-panel">
      {applications.length === 0 ? (
        <EmptyState message="No finance applications." />
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Number</th><th>Customer</th><th>Product</th><th>EMI</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {applications.map((a: {
              id: string;
              applicationNumber: string;
              customerName: string;
              productName: string;
              monthlyInstallment: number;
              status: string;
            }) => (
              <tr key={a.id}>
                <td>{a.applicationNumber}</td>
                <td>{a.customerName}</td>
                <td>{a.productName}</td>
                <td>₹{a.monthlyInstallment}</td>
                <td><StatusBadge status={a.status} /></td>
                <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => actionMutation.mutate({ id: a.id, action: "review" })}>Review</button>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => actionMutation.mutate({ id: a.id, action: "approve" })}>Approve</button>
                  <button type="button" className="admin-btn admin-btn--danger" onClick={() => actionMutation.mutate({ id: a.id, action: "reject", reason: "Does not meet criteria" })}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminFinanceApplicationsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Finance applications">
          <ApplicationsAdmin />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
