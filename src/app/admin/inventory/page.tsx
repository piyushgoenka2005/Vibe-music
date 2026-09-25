"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatCard, StatusBadge, LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState, MutationError } from "@/components/admin/AdminQueryState";
import type { InventoryRecord } from "@/types/admin";
import { downloadFromApi } from "@/lib/client/downloadFromApi";

function InventoryContent({ inventoryWrite }: { inventoryWrite: boolean }) {
  const queryClient = useQueryClient();
  const [adjustProduct, setAdjustProduct] = useState<InventoryRecord | null>(null);
  const [newQty, setNewQty] = useState(0);
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "ok">("all");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: adjustmentsData } = useQuery({
    queryKey: ["admin-inventory-adjustments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory?view=adjustments");
      if (!res.ok) throw new Error("Failed to load adjustments");
      return res.json() as Promise<{
        adjustments: Array<{
          id: string;
          productId: string;
          sku: string;
          previousStock: number;
          newStock: number;
          quantityChanged: number;
          action: string;
          adminId?: string | null;
          timestamp: string;
          note?: string;
        }>;
      }>;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!adjustProduct) return;
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: adjustProduct.productId, newQuantity: newQty, reason }),
      });
      if (!res.ok) throw new Error("Adjust failed");
    },
    onSuccess: () => {
      setAdjustProduct(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory-adjustments"] });
    },
  });

  const inventory: InventoryRecord[] = useMemo(() => data?.inventory ?? [], [data?.inventory]);
  const stats = data?.stats;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter((item) => {
      const available = item.availableQuantity ?? item.stockQuantity;
      if (stockFilter === "out" && available > 0) return false;
      if (stockFilter === "low" && !(available > 0 && available <= item.lowStockThreshold)) {
        return false;
      }
      if (stockFilter === "ok" && available <= item.lowStockThreshold) return false;
      if (!q) return true;
      return (
        item.productName.toLowerCase().includes(q) || (item.sku?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [inventory, search, stockFilter]);

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load inventory."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      {stats ? (
        <div className="admin-stat-grid">
          <StatCard label="Total SKUs" value={stats.totalSkus} />
          <StatCard label="Low Stock" value={stats.lowStock} />
          <StatCard label="Out of Stock" value={stats.outOfStock} />
          <StatCard label="Total Units" value={stats.totalUnits} />
        </div>
      ) : null}

      {inventoryWrite && adjustProduct ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Adjust: {adjustProduct.productName}</h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>New Quantity</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                />
              </div>
              <div className="admin-form-group">
                <label>Reason</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => adjustMutation.mutate()}
              >
                Save Adjustment
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setAdjustProduct(null)}
              >
                Cancel
              </button>
            </div>
            <MutationError error={adjustMutation.isError ? adjustMutation.error : null} />
          </div>
        </div>
      ) : null}

      <div className="admin-toolbar admin-toolbar--wrap">
        <input
          className="admin-input"
          placeholder="Search product or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search inventory"
        />
        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          aria-label="Filter stock level"
        >
          <option value="all">All stock levels</option>
          <option value="ok">Healthy</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => {
            downloadFromApi("/api/admin/inventory?export=csv");
          }}
        >
          Export CSV
        </button>
        <span style={{ fontSize: "0.8125rem", color: "var(--admin-muted)" }}>
          Showing {filtered.length} of {inventory.length}
        </span>
      </div>

      <div className="admin-panel">
        {filtered.length === 0 ? (
          <EmptyState message="No inventory records match your filters." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>On Hand</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: InventoryRecord) => (
                  <tr key={item.productId}>
                    <td>
                      <Link href={`/admin/products/${encodeURIComponent(item.productId)}`}>
                        {item.productName}
                      </Link>
                    </td>
                    <td>{item.sku ?? "—"}</td>
                    <td>{item.stockQuantity}</td>
                    <td>{item.reservedQuantity ?? 0}</td>
                    <td>{item.availableQuantity ?? item.stockQuantity}</td>
                    <td>{item.lowStockThreshold}</td>
                    <td>
                      <StatusBadge
                        status={
                          item.availableQuantity !== undefined && item.availableQuantity <= 0
                            ? "out-of-stock"
                            : item.availableQuantity !== undefined &&
                                item.availableQuantity <= item.lowStockThreshold
                              ? "limited"
                              : "in-stock"
                        }
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {inventoryWrite ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => {
                              setAdjustProduct(item);
                              setNewQty(item.stockQuantity);
                            }}
                          >
                            Adjust
                          </button>
                        ) : null}
                        <Link
                          href={`/admin/products/${encodeURIComponent(item.productId)}`}
                          className="admin-btn admin-btn--ghost"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Adjustment history</h2>
        </div>
        {(adjustmentsData?.adjustments ?? []).length === 0 ? (
          <EmptyState message="No stock adjustments logged yet." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>SKU</th>
                  <th>Change</th>
                  <th>Stock</th>
                  <th>Action</th>
                  <th>By</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {(adjustmentsData?.adjustments ?? []).map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString("en-IN")}</td>
                    <td>{log.sku || log.productId.slice(0, 8)}</td>
                    <td>
                      {log.quantityChanged > 0 ? "+" : ""}
                      {log.quantityChanged}
                    </td>
                    <td>
                      {log.previousStock} → {log.newStock}
                    </td>
                    <td>{log.action}</td>
                    <td>{log.adminId ?? "—"}</td>
                    <td>{log.note ?? "—"}</td>
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

import { getAdminCapabilities } from "@/lib/auth/adminCapabilities";

export default function AdminInventoryPage() {
  return (
    <AdminGuard>
      {(admin) => {
        const caps = getAdminCapabilities(admin.permissions);
        return (
          <AdminShell admin={admin} title="Inventory">
            <InventoryContent inventoryWrite={caps.inventoryWrite} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
