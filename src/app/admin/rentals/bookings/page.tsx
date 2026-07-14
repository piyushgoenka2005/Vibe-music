"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState, StatusBadge } from "@/components/admin/AdminUi";
import { formatCurrency } from "@/utils/currency";

function BookingsAdmin() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-rental-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/bookings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await fetch(`/api/admin/rentals/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-rental-bookings"] }),
  });

  if (isLoading) return <LoadingState />;

  const bookings = data?.bookings ?? [];

  return (
    <div className="admin-panel">
      {bookings.length === 0 ? (
        <EmptyState message="No rental bookings yet." />
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Number</th><th>Customer</th><th>Status</th><th>Total</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {bookings.map((b: {
              id: string;
              bookingNumber: string;
              customerName: string;
              status: string;
              total: number;
            }) => (
              <tr key={b.id}>
                <td>{b.bookingNumber}</td>
                <td>{b.customerName}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>{formatCurrency(b.total)}</td>
                <td style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => actionMutation.mutate({ id: b.id, action: "activate" })}>Activate</button>
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => actionMutation.mutate({ id: b.id, action: "return" })}>Return</button>
                  <button type="button" className="admin-btn admin-btn--danger" onClick={() => actionMutation.mutate({ id: b.id, action: "cancel" })}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminRentalBookingsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Rental bookings">
          <BookingsAdmin />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
