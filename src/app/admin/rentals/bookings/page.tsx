"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { EmptyState, LoadingState, StatusBadge, formatDate } from "@/components/admin/AdminUi";
import { formatCurrency } from "@/utils/currency";
import type { RentalBooking, RentalBookingStatus } from "@/types/rental";

const STATUS_OPTIONS: RentalBookingStatus[] = [
  "pending",
  "confirmed",
  "active",
  "returned",
  "completed",
  "cancelled",
  "late",
];

function BookingsAdmin() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("id");
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkId);
  const [damageCharge, setDamageCharge] = useState("0");
  const [cancelReason, setCancelReason] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState<RentalBookingStatus>("confirmed");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (deepLinkId) setSelectedId(deepLinkId);
  }, [deepLinkId]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-rental-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/bookings");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ bookings: RentalBooking[] }>;
    },
  });

  const { data: detailData, isLoading: detailLoading, isError: detailError, refetch: refetchDetail, isFetching: detailFetching } = useQuery({
    queryKey: ["admin-rental-booking", selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/rentals/bookings/${selectedId}`);
      if (!res.ok) throw new Error("Failed to load booking");
      return res.json() as Promise<{ booking: RentalBooking }>;
    },
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    if (detailData?.booking) {
      setNewStatus(detailData.booking.status);
    }
  }, [detailData?.booking]);

  const actionMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!selectedId) throw new Error("No booking selected");
      const res = await fetch(`/api/admin/rentals/bookings/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Action failed");
    },
    onSuccess: () => {
      setActionError(null);
      setCancelReason("");
      setDamageCharge("0");
      setStatusNote("");
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-booking", selectedId] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message="Unable to load rental bookings."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const bookings = data?.bookings ?? [];
  const selected = detailData?.booking;

  return (
    <div className="admin-grid-2">
      <div className="admin-panel">
        {bookings.length === 0 ? (
          <EmptyState message="No rental bookings yet." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedId === b.id ? "var(--admin-surface-2)" : undefined,
                    }}
                    onClick={() => {
                      setSelectedId(b.id);
                      setActionError(null);
                    }}
                  >
                    <td>{b.bookingNumber}</td>
                    <td>{b.customerName}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>{formatCurrency(b.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Booking detail</h2>
        </div>
        <div className="admin-panel__body">
          {!selectedId ? (
            <EmptyState message="Select a booking." />
          ) : detailLoading ? (
            <LoadingState message="Loading booking…" />
          ) : detailError ? (
            <ErrorState
              message="Unable to load booking details."
              onRetry={() => void refetchDetail()}
              isRetrying={detailFetching}
            />
          ) : !selected ? (
            <EmptyState message="Booking not found." />
          ) : (
            <>
              {actionError ? (
                <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
                  <p className="admin-error__message">{actionError}</p>
                </div>
              ) : null}
              <p>
                <strong>Number:</strong> {selected.bookingNumber}
              </p>
              <p>
                <strong>Customer:</strong> {selected.customerName} ({selected.email})
              </p>
              {selected.customerPhone ? (
                <p>
                  <strong>Phone:</strong> {selected.customerPhone}
                </p>
              ) : null}
              <p>
                <strong>Status:</strong> <StatusBadge status={selected.status} />
              </p>
              <p>
                <strong>Start:</strong> {formatDate(selected.startAt)}
              </p>
              <p>
                <strong>End:</strong> {formatDate(selected.endAt)}
              </p>
              <p>
                <strong>Subtotal:</strong> {formatCurrency(selected.subtotal)}
              </p>
              <p>
                <strong>Deposit:</strong> {formatCurrency(selected.depositAmount)}
              </p>
              <p>
                <strong>Total:</strong> {formatCurrency(selected.total)}
              </p>
              {selected.damageCharges ? (
                <p>
                  <strong>Damage charge:</strong> {formatCurrency(selected.damageCharges)}
                </p>
              ) : null}
              {selected.cancellationReason ? (
                <p>
                  <strong>Cancel reason:</strong> {selected.cancellationReason}
                </p>
              ) : null}
              <p style={{ marginTop: "0.75rem" }}>
                <strong>Items:</strong>
              </p>
              <ul style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>
                {(selected.items ?? []).map((item) => (
                  <li key={item.id}>
                    {item.productName} × {item.quantity} — {formatCurrency(item.lineSubtotal)}
                  </li>
                ))}
              </ul>

              <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                <label>Update status</label>
                <select
                  className="admin-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RentalBookingStatus)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>Status note</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={actionMutation.isPending}
                onClick={() =>
                  actionMutation.mutate({
                    status: newStatus,
                    note: statusNote || undefined,
                  })
                }
              >
                Save status
              </button>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ action: "activate" })}
                >
                  Activate
                </button>
              </div>

              <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                <label>Damage charge on return (₹)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  value={damageCharge}
                  onChange={(e) => setDamageCharge(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={actionMutation.isPending}
                onClick={() =>
                  actionMutation.mutate({
                    action: "return",
                    damageCharge: Number(damageCharge) || 0,
                    returnedAt: new Date().toISOString(),
                  })
                }
              >
                Mark returned
              </button>

              <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                <label>Cancel reason</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={actionMutation.isPending}
                onClick={() => {
                  if (!window.confirm("Cancel this rental booking?")) return;
                  actionMutation.mutate({
                    action: "cancel",
                    reason: cancelReason || undefined,
                  });
                }}
              >
                Cancel booking
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminRentalBookingsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Rental bookings">
          <Suspense fallback={<LoadingState />}>
            <BookingsAdmin />
          </Suspense>
        </AdminShell>
      )}
    </AdminGuard>
  );
}
