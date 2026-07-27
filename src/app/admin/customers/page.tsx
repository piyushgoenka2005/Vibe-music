"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import {
  StatusBadge,
  LoadingState,
  EmptyState,
  formatCurrency,
  formatDate,
} from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import { adminOrderPath } from "@/lib/routes";

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

function CustomersContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } =
    useAdminCursorPagination();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
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

  const statusMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!selectedId) throw new Error("No customer selected");
      const res = await fetch(`/api/admin/customers/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Status update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setStatusError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-customer", selectedId],
      });
    },
    onError: (error) => {
      setStatusError(
        error instanceof Error ? error.message : "Status update failed"
      );
    },
  });

  const eraseMutation = useMutation({
    mutationFn: async (uid: string) => {
      const res = await fetch(`/api/admin/customers/${uid}`, { method: "DELETE" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "Erase failed");
    },
    onSuccess: () => {
      setSelectedId(null);
      setStatusError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load customers."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const customers = data?.customers ?? [];
  const hasMore = data?.hasMore ?? false;
  const customer = detail?.customer as
    | {
        uid: string;
        displayName: string;
        email: string;
        orderCount: number;
        totalSpent: number;
        createdAt: string;
        isActive: boolean;
        orders?: Array<{
          id: string;
          total: number;
          status: string;
          createdAt: string;
        }>;
      }
    | undefined;

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="Search customers…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
        />
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => {
            window.location.href = "/api/admin/customers?export=csv";
          }}
        >
          Export CSV
        </button>
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
                    {customers.map((c) => (
                      <tr
                        key={c.uid}
                        onClick={() => {
                          setSelectedId(c.uid);
                          setStatusError(null);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{c.displayName || "—"}</td>
                        <td>{c.email}</td>
                        <td>{c.orderCount}</td>
                        <td>{formatCurrency(c.totalSpent)}</td>
                        <td>
                          <StatusBadge
                            status={c.isActive ? "active" : "cancelled"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="admin-pagination">
                <span>Page {pageIndex + 1}</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    disabled={!canGoPrev}
                    onClick={goPrev}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    disabled={!hasMore}
                    onClick={() => goNext(data?.nextCursor)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Customer Detail</h2>
          </div>
          <div className="admin-panel__body">
            {!selectedId || !customer ? (
              <EmptyState message="Select a customer." />
            ) : (
              <>
                <p>
                  <strong>{customer.displayName}</strong>
                </p>
                <p>{customer.email}</p>
                <p>
                  Orders: {customer.orderCount} · Spent:{" "}
                  {formatCurrency(customer.totalSpent)}
                </p>
                <p>Joined: {formatDate(customer.createdAt)}</p>
                <p>
                  Account:{" "}
                  <StatusBadge
                    status={customer.isActive ? "active" : "cancelled"}
                  />
                </p>
                {canWrite ? (
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={
                        customer.isActive
                          ? "admin-btn admin-btn--secondary"
                          : "admin-btn admin-btn--primary"
                      }
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(!customer.isActive)}
                    >
                      {statusMutation.isPending
                        ? "Updating…"
                        : customer.isActive
                          ? "Deactivate account"
                          : "Activate account"}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      disabled={eraseMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Permanently erase ${customer.email}? Orders stay for records but personal data is redacted.`
                          )
                        ) {
                          eraseMutation.mutate(selectedId!);
                        }
                      }}
                    >
                      {eraseMutation.isPending ? "Erasing…" : "Erase customer"}
                    </button>
                    {statusError ? (
                      <p
                        role="alert"
                        style={{
                          color: "var(--admin-danger)",
                          fontSize: "0.8125rem",
                          marginTop: "0.5rem",
                          width: "100%",
                        }}
                      >
                        {statusError}
                      </p>
                    ) : null}
                    {eraseMutation.isError ? (
                      <p
                        role="alert"
                        style={{
                          color: "var(--admin-danger)",
                          fontSize: "0.8125rem",
                          marginTop: "0.5rem",
                          width: "100%",
                        }}
                      >
                        {(eraseMutation.error as Error).message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {canWrite ? (
                  <p
                    style={{
                      color: "var(--admin-muted)",
                      fontSize: "0.75rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    Deactivated customers cannot sign in with email/password. Erase
                    permanently removes the account and redacts personal order data.
                  </p>
                ) : null}
                <h3 style={{ fontSize: "0.875rem", marginTop: "1rem" }}>
                  Order History
                </h3>
                {customer.orders?.length === 0 ? (
                  <p
                    style={{
                      color: "var(--admin-muted)",
                      fontSize: "0.875rem",
                    }}
                  >
                    No orders
                  </p>
                ) : (
                  <ul style={{ fontSize: "0.875rem" }}>
                    {(customer.orders ?? []).map((o) => (
                      <li key={o.id}>
                        <Link href={adminOrderPath(o.id)}>
                          {formatDate(o.createdAt)} — {formatCurrency(o.total)} —{" "}
                          <StatusBadge status={o.status} />
                        </Link>
                      </li>
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
          <CustomersContent
            canWrite={admin.permissions.includes("customers:write")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
