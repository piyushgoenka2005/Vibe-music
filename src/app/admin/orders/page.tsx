"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import AdminOrderShipment from "@/components/admin/AdminOrderShipment";
import AdminNotice from "@/components/admin/AdminNotice";
import {
  StatusBadge,
  LoadingState,
  EmptyState,
  formatCurrency,
  formatDate,
} from "@/components/admin/AdminUi";
import { ErrorState, MutationError } from "@/components/admin/AdminQueryState";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import type { AdminCapabilities } from "@/lib/auth/adminCapabilities";
import type { Order, OrderStatus } from "@/types/order";

async function fetchOrders(params: { search: string; status: string; cursor?: string }) {
  const sp = new URLSearchParams({ limit: "20" });
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.cursor) sp.set("cursor", params.cursor);
  const res = await fetch(`/api/admin/orders?${sp}`);
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json() as Promise<{
    orders: Order[];
    hasMore: boolean;
    nextCursor?: string;
  }>;
}

async function fetchOrderDetail(orderId: string): Promise<Order> {
  const res = await fetch(`/api/admin/orders/${orderId}`);
  if (!res.ok) throw new Error("Failed to load order");
  const data = (await res.json()) as { order: Order };
  return data.order;
}

function OrdersContent({
  ordersWrite,
  ordersRefund,
}: Pick<AdminCapabilities, "ordersWrite" | "ordersRefund">) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const deepLinkOrderId = searchParams.get("orderId");
  const deepLinkStatus = searchParams.get("status");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => deepLinkStatus ?? "");
  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } = useAdminCursorPagination();
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkOrderId);
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [note, setNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (deepLinkOrderId) setSelectedId(deepLinkOrderId);
  }, [deepLinkOrderId]);

  useEffect(() => {
    if (deepLinkStatus) {
      setStatus(deepLinkStatus);
      reset();
    }
  }, [deepLinkStatus, reset]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-orders", search, status, cursor],
    queryFn: () => fetchOrders({ search, status, cursor }),
  });

  const { data: selected, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-order-detail", selectedId],
    queryFn: () => fetchOrderDetail(selectedId!),
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    if (selected) setNewStatus(selected.status);
  }, [selected]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      if (
        newStatus === "refunded" &&
        selected.paymentStatus === "paid" &&
        selected.razorpayPaymentId
      ) {
        throw new Error(
          "This order is still paid on Razorpay. Use Refund via Razorpay below — do not mark status refunded first.",
        );
      }
      const res = await fetch(`/api/admin/orders/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: note || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
    },
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", selectedId] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const amount = refundAmount.trim() ? Number(refundAmount) : undefined;
      if (amount != null && (!Number.isFinite(amount) || amount <= 0)) {
        throw new Error("Enter a valid refund amount in INR");
      }
      if (amount != null && amount > selected.total) {
        throw new Error(`Refund cannot exceed order total (${selected.total})`);
      }
      const res = await fetch(`/api/admin/orders/${selected.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note || undefined,
          ...(amount != null ? { amount } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Refund failed");
    },
    onSuccess: () => {
      setNote("");
      setRefundAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", selectedId] });
    },
  });

  async function exportCsv() {
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ export: "csv" }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Export failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load orders."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const orders = data?.orders ?? [];
  const hasMore = data?.hasMore ?? false;

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="Search orders…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
        />
        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            reset();
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => {
            setExportError(null);
            exportCsv().catch((err) => {
              setExportError(err instanceof Error ? err.message : "Export failed");
            });
          }}
        >
          Export CSV
        </button>
        {exportError ? (
          <p className="admin-error__message" role="alert">
            {exportError}
          </p>
        ) : null}
      </div>

      <div className="admin-grid-2">
        <div className="admin-panel">
          {orders.length === 0 ? (
            <EmptyState message="No orders found." />
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => {
                          setSelectedId(order.id);
                          setNewStatus(order.status);
                        }}
                        style={{
                          cursor: "pointer",
                          background:
                            selectedId === order.id ? "var(--admin-surface-2)" : undefined,
                        }}
                      >
                        <td>{order.id.slice(0, 10)}…</td>
                        <td>{order.email}</td>
                        <td>{formatCurrency(order.total)}</td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
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
            <h2 className="admin-panel__title">Order Details</h2>
          </div>
          <div className="admin-panel__body">
            {!selectedId ? (
              <EmptyState message="Select an order to view details." />
            ) : detailLoading ? (
              <LoadingState message="Loading order…" />
            ) : !selected ? (
              <EmptyState message="Order not found." />
            ) : (
              <>
                <p>
                  <strong>ID:</strong> {selected.id}
                </p>
                <p>
                  <strong>Email:</strong> {selected.email}
                </p>
                {selected.customerName ? (
                  <p>
                    <strong>Customer:</strong> {selected.customerName}
                  </p>
                ) : null}
                {selected.customerPhone ? (
                  <p>
                    <strong>Phone:</strong> {selected.customerPhone}
                  </p>
                ) : null}
                <p>
                  <strong>Order status:</strong> <StatusBadge status={selected.status} />
                </p>
                <p>
                  <strong>Payment:</strong> <StatusBadge status={selected.paymentStatus} /> (
                  {selected.paymentMethod})
                </p>
                {selected.inventoryStatus ? (
                  <p>
                    <strong>Inventory:</strong> {selected.inventoryStatus}
                  </p>
                ) : null}
                {selected.razorpayOrderId ? (
                  <p>
                    <strong>Razorpay order:</strong>{" "}
                    <code style={{ fontSize: "0.8rem" }}>{selected.razorpayOrderId}</code>
                  </p>
                ) : null}
                {selected.razorpayPaymentId ? (
                  <p>
                    <strong>Razorpay payment:</strong>{" "}
                    <code style={{ fontSize: "0.8rem" }}>{selected.razorpayPaymentId}</code>
                  </p>
                ) : null}
                <p>
                  <strong>Placed:</strong> {formatDate(selected.createdAt)}
                </p>

                <div className="admin-order-money">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selected.subtotal)}</span>
                  {selected.couponDiscount > 0 ? (
                    <>
                      <span>Coupon{selected.couponCode ? ` (${selected.couponCode})` : ""}</span>
                      <span>−{formatCurrency(selected.couponDiscount)}</span>
                    </>
                  ) : null}
                  <span>Shipping</span>
                  <span>{formatCurrency(selected.shippingCharge)}</span>
                  {selected.platformFee > 0 ? (
                    <>
                      <span>Platform fee</span>
                      <span>{formatCurrency(selected.platformFee)}</span>
                    </>
                  ) : null}
                  <span>GST</span>
                  <span>{formatCurrency(selected.totalGst)}</span>
                  <span className="admin-order-money__total">Total</span>
                  <span className="admin-order-money__total">{formatCurrency(selected.total)}</span>
                </div>

                <p>
                  <strong>Shipping:</strong>
                </p>
                <address
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--admin-muted)",
                    fontStyle: "normal",
                    marginBottom: "0.75rem",
                  }}
                >
                  {selected.shippingAddress.name}
                  <br />
                  {selected.shippingAddress.line1}
                  <br />
                  {selected.shippingAddress.line2 ? (
                    <>
                      {selected.shippingAddress.line2}
                      <br />
                    </>
                  ) : null}
                  {selected.shippingAddress.city}, {selected.shippingAddress.state}{" "}
                  {selected.shippingAddress.postalCode}
                  <br />
                  {selected.shippingAddress.country}
                </address>
                <p>
                  <strong>Line items</strong>
                </p>
                <div className="admin-table-wrap" style={{ marginBottom: "0.75rem" }}>
                  <table className="admin-table" style={{ fontSize: "0.8125rem" }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Line</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item) => (
                        <tr key={`${item.productId}-${item.variantId ?? "default"}`}>
                          <td>
                            <div>{item.name}</div>
                            {item.variantLabel ? (
                              <div style={{ color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                                {item.variantLabel}
                              </div>
                            ) : null}
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}
                >
                  <a
                    className="admin-btn admin-btn--secondary"
                    href={`/api/invoices/${encodeURIComponent(selected.id)}/html`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View invoice
                  </a>
                  <a
                    className="admin-btn admin-btn--ghost"
                    href={`/api/invoices/${encodeURIComponent(selected.id)}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </a>
                </div>

                {selected.paymentStatus === "paid" && selected.razorpayPaymentId ? (
                  <AdminNotice tone="warning" title="Money refunds are separate from status">
                    Marking an order “Refunded” does not pay the customer back. Use{" "}
                    <strong>Refund via Razorpay</strong> below for full or partial refunds.
                  </AdminNotice>
                ) : null}

                {ordersWrite ? (
                  <>
                    <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                      <label>Update Status</label>
                      <select
                        className="admin-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label>Note (optional)</label>
                      <input
                        className="admin-input"
                        style={{ width: "100%" }}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate()}
                    >
                      {updateMutation.isPending ? "Updating…" : "Update Order"}
                    </button>
                    <MutationError error={updateMutation.isError ? updateMutation.error : null} />
                  </>
                ) : null}
                {ordersRefund && selected.paymentStatus === "paid" && selected.razorpayPaymentId ? (
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--admin-border)",
                    }}
                  >
                    <div className="admin-form-group">
                      <label htmlFor="refund-amount">Refund amount (INR)</label>
                      <input
                        id="refund-amount"
                        className="admin-input"
                        style={{ width: "100%" }}
                        type="number"
                        min={0.01}
                        step="0.01"
                        max={selected.total}
                        placeholder={`Full refund = ${selected.total} (leave blank)`}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      disabled={refundMutation.isPending}
                      onClick={() => {
                        const label = refundAmount.trim()
                          ? `partial refund of ₹${refundAmount}`
                          : "full Razorpay refund";
                        if (
                          window.confirm(
                            `Initiate a ${label} for this order? This cannot be undone.`,
                          )
                        ) {
                          refundMutation.mutate();
                        }
                      }}
                    >
                      {refundMutation.isPending ? "Refunding…" : "Refund via Razorpay"}
                    </button>
                  </div>
                ) : null}
                {refundMutation.isError ? (
                  <p style={{ color: "var(--admin-danger)", marginTop: "0.5rem" }}>
                    {refundMutation.error instanceof Error
                      ? refundMutation.error.message
                      : "Refund failed"}
                  </p>
                ) : null}
                {ordersWrite ? <AdminOrderShipment orderId={selected.id} /> : null}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import { getAdminCapabilities } from "@/lib/auth/adminCapabilities";

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      {(admin) => {
        const caps = getAdminCapabilities(admin.permissions);
        return (
          <AdminShell admin={admin} title="Orders">
            <Suspense fallback={<LoadingState />}>
              <OrdersContent ordersWrite={caps.ordersWrite} ordersRefund={caps.ordersRefund} />
            </Suspense>
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
