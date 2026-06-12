"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, LoadingState, EmptyState } from "@/components/admin/AdminUi";
import type { ReviewDocument } from "@/types/admin";

function ReviewsContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", statusFilter],
    queryFn: async () => {
      const sp = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/reviews${sp}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ reviews: ReviewDocument[] }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewDocument["status"] }) => {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  if (isLoading) return <LoadingState />;

  const reviews = data?.reviews ?? [];

  return (
    <>
      <div className="admin-toolbar">
        <select className="admin-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="admin-panel">
        {reviews.length === 0 ? (
          <EmptyState message="No reviews." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Product</th><th>Author</th><th>Rating</th><th>Title</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td>{r.productName ?? r.productId}</td>
                    <td>{r.author}</td>
                    <td>{r.rating}★</td>
                    <td>{r.title}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {r.status !== "approved" ? (
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => updateMutation.mutate({ id: r.id, status: "approved" })}>Approve</button>
                      ) : null}
                      {r.status !== "rejected" ? (
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => updateMutation.mutate({ id: r.id, status: "rejected" })}>Reject</button>
                      ) : null}
                      <button type="button" className="admin-btn admin-btn--danger" onClick={() => deleteMutation.mutate(r.id)}>Delete</button>
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

export default function AdminReviewsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Reviews">
          <ReviewsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
