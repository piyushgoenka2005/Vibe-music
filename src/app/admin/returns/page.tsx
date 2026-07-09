"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState, StatusBadge, formatDate } from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";
import type { ReturnRequest, ReturnRequestStatus } from "@/types/returnRequest";

function ReturnsContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState<ReturnRequestStatus>("approved");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-returns", statusFilter],
    queryFn: async () => {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/returns${qs}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ returns: ReturnRequest[] }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const res = await fetch(`/api/admin/returns/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote: adminNote || undefined }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      setSelected(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
    },
  });

  if (isLoading) return <LoadingState />;

  const returns = data?.returns ?? [];

  return (
    <div className="admin-grid-2">
      <div className="admin-panel">
        <div className="admin-toolbar">
          <select
            className="admin-select"
            style={{ width: "auto" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="received">Received</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {returns.length === 0 ? (
          <EmptyState message="No return requests." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((item) => (
                  <tr
                    key={item.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelected(item);
                      setNewStatus(item.status);
                      setAdminNote(item.adminNote ?? "");
                    }}
                  >
                    <td>
                      <Link
                        href={ROUTES.adminOrders}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.orderId.slice(0, 8)}…
                      </Link>
                    </td>
                    <td>{item.reason}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Return details</h2>
        </div>
        <div className="admin-panel__body">
          {!selected ? (
            <EmptyState message="Select a return request." />
          ) : (
            <>
              <p>
                <strong>Order:</strong> {selected.orderId}
              </p>
              <p>
                <strong>Email:</strong> {selected.email}
              </p>
              <p>
                <strong>Reason:</strong> {selected.reason}
              </p>
              {selected.details ? (
                <p>
                  <strong>Details:</strong> {selected.details}
                </p>
              ) : null}
              <p>
                <strong>Status:</strong> <StatusBadge status={selected.status} />
              </p>
              <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                <label>Update status</label>
                <select
                  className="admin-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReturnRequestStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="received">Received</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Admin note</label>
                <textarea
                  className="admin-textarea"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReturnsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Returns & RMA">
          <ReturnsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
