"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, LoadingState, EmptyState, formatCurrency, formatDate } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";

async function fetchCustomers(params: { search: string; cursor?: string }) {
  const sp = new URLSearchParams({ limit: "20" });
  if (params.search) sp.set("search", params.search);
  if (params.cursor) sp.set("cursor", params.cursor);
  const res = await fetch(`/api/admin/customers?${sp}`);
  if (!res.ok) throw new Error("Failed to load customers");
  return res.json() as Promise<{
    customers: Array<{
      uid: string;
      email: string;
      displayName: string;
      isActive: boolean;
      orderCount: number;
      totalSpent: number;
      createdAt: string;
    }>;
    hasMore: boolean;
    nextCursor?: string;
  }>;
}

function CustomersContent() {
  const [search, setSearch] = useState("");
  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } =
    useAdminCursorPagination();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-customers", search, cursor],
    queryFn: () => fetchCustomers({ search, cursor }),
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-customer", selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/customers/${selectedId}`);
      if (!res.ok) throw new Error("Failed to load customer");
      return res.json();
    },
    enabled: !!selectedId,
  });

  if (isLoading) return <LoadingState />;

  const customers = data?.customers ?? [];
  const hasMore = data?.hasMore ?? false;

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-input" placeholder="Search customers…" value={search} onChange={(e) => { setSearch(e.target.value); reset(); }} />
      </div>
      <div className="admin-grid-2">
        <div className="admin-panel">
          {customers.length === 0 ? (
            <EmptyState message="No customers found." />
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Orders</th>
                      <th>Spent</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c: { uid: string; displayName: string; email: string; orderCount: number; totalSpent: number; isActive: boolean }) => (
                      <tr key={c.uid} onClick={() => setSelectedId(c.uid)} style={{ cursor: "pointer" }}>
                        <td>{c.displayName || "—"}</td>
                        <td>{c.email}</td>
                        <td>{c.orderCount}</td>
                        <td>{formatCurrency(c.totalSpent)}</td>
                        <td><StatusBadge status={c.isActive ? "active" : "cancelled"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="admin-pagination">
                <span>Page {pageIndex + 1}</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="admin-btn admin-btn--secondary" disabled={!canGoPrev} onClick={goPrev}>Previous</button>
                  <button type="button" className="admin-btn admin-btn--secondary" disabled={!hasMore} onClick={() => goNext(data?.nextCursor)}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="admin-panel">
          <div className="admin-panel__header"><h2 className="admin-panel__title">Customer Detail</h2></div>
          <div className="admin-panel__body">
            {!selectedId || !detail?.customer ? (
              <EmptyState message="Select a customer." />
            ) : (
              <>
                <p><strong>{detail.customer.displayName}</strong></p>
                <p>{detail.customer.email}</p>
                <p>Orders: {detail.customer.orderCount} · Spent: {formatCurrency(detail.customer.totalSpent)}</p>
                <p>Joined: {formatDate(detail.customer.createdAt)}</p>
                <h3 style={{ fontSize: "0.875rem", marginTop: "1rem" }}>Order History</h3>
                {detail.customer.orders?.length === 0 ? (
                  <p style={{ color: "var(--admin-muted)", fontSize: "0.875rem" }}>No orders</p>
                ) : (
                  <ul style={{ fontSize: "0.875rem" }}>
                    {(detail.customer.orders as Array<{ id: string; total: number; status: string; createdAt: string }>).map((o) => (
                      <li key={o.id}>{formatDate(o.createdAt)} — {formatCurrency(o.total)} — <StatusBadge status={o.status} /></li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminCustomersPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Customers">
          <CustomersContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
