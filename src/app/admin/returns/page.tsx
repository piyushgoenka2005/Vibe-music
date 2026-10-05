"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import AdminNotice from "@/components/admin/AdminNotice";
import { LoadingState, EmptyState, StatusBadge, formatDate } from "@/components/admin/AdminUi";
import {
  ErrorState,
  MutationError,
  adminFetchJson,
  adminMutateJson,
} from "@/components/admin/AdminQueryState";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import { adminOrderPath } from "@/lib/routes";
import { getAdminCapabilities } from "@/lib/auth/adminCapabilities";
import type { ReturnRequest, ReturnRequestStatus } from "@/types/returnRequest";

function ReturnsContent({ ordersWrite }: { ordersWrite: boolean }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState<ReturnRequestStatus>("approved");
  const [refundAmount, setRefundAmount] = useState("");
  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } = useAdminCursorPagination();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-returns", statusFilter, cursor],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (cursor) params.set("cursor", cursor);
      return adminFetchJson<{
        returns: ReturnRequest[];
        hasMore: boolean;
        nextCursor?: string;
        total: number;
      }>(`/api/admin/returns?${params}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const amount = refundAmount.trim() ? Number(refundAmount) : undefined;
      await adminMutateJson(`/api/admin/returns/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNote: adminNote || undefined,
          refundAmount: amount,
        }),
      });
    },
    onSuccess: () => {
      setSelected(null);
      setAdminNote("");
      setRefundAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load return requests."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const returns = data?.returns ?? [];
  const hasMore = data?.hasMore ?? false;

  return (
    <>
      <AdminNotice tone="info" title="Refunded status triggers Razorpay">
        Setting a return to <strong>Refunded</strong> initiates a Razorpay refund for the linked
        order. Leave refund amount blank for a full refund, or enter a partial amount in rupees.
      </AdminNotice>
      <div className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-toolbar">
            <select
              className="admin-select"
              style={{ width: "auto" }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                reset();
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="received">Received</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {data?.total != null ? (
              <span style={{ color: "var(--admin-muted)", fontSize: "0.875rem" }}>
                {data.total} total
              </span>
            ) : null}
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
                        setRefundAmount("");
                      }}
                    >
                      <td>
                        <Link
                          href={adminOrderPath(item.orderId)}
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
          <div className="admin-toolbar" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!canGoPrev || isFetching}
              onClick={goPrev}
            >
              Previous
            </button>
            <span style={{ color: "var(--admin-muted)", fontSize: "0.875rem" }}>
              Page {pageIndex + 1}
            </span>
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
                  <strong>Order:</strong>{" "}
                  <Link href={adminOrderPath(selected.orderId)}>{selected.orderId}</Link>
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
                {ordersWrite ? (
                  <>
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
                    {newStatus === "refunded" ? (
                      <div className="admin-form-group">
                        <label>Refund amount (₹)</label>
                        <input
                          className="admin-input"
                          type="number"
                          min={1}
                          step="0.01"
                          placeholder="Leave blank for full order refund"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                        />
                      </div>
                    ) : null}
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
                    {newStatus === "refunded" ? (
                      <p
                        style={{
                          marginTop: "0.75rem",
                          fontSize: "0.8125rem",
                          color: "var(--admin-muted)",
                        }}
                      >
                        Saving will automatically issue the Razorpay refund for the linked paid
                        order. You can also review payment details on the{" "}
                        <Link href={adminOrderPath(selected.orderId)} className="admin-link">
                          order page
                        </Link>
                        .
                      </p>
                    ) : null}
                    <MutationError error={updateMutation.isError ? updateMutation.error : null} />
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminReturnsPage() {
  return (
    <AdminGuard>
      {(admin) => {
        const caps = getAdminCapabilities(admin.permissions);
        return (
          <AdminShell admin={admin} title="Returns & RMA">
            <ReturnsContent ordersWrite={caps.ordersWrite} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
