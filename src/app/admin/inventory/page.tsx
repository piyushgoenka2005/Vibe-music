"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatCard, StatusBadge, LoadingState, EmptyState } from "@/components/admin/AdminUi";
import type { InventoryRecord } from "@/types/admin";

function InventoryContent() {
  const queryClient = useQueryClient();
  const [adjustProduct, setAdjustProduct] = useState<InventoryRecord | null>(null);
  const [newQty, setNewQty] = useState(0);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory");
      if (!res.ok) throw new Error("Failed");
      return res.json();
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
    },
  });

  if (isLoading) return <LoadingState />;

  const inventory = data?.inventory ?? [];
  const stats = data?.stats;

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

      {adjustProduct ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__header"><h2 className="admin-panel__title">Adjust: {adjustProduct.productName}</h2></div>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              <div className="admin-form-group"><label>New Quantity</label><input className="admin-input" style={{ width: "100%" }} type="number" min={0} value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} /></div>
              <div className="admin-form-group"><label>Reason</label><input className="admin-input" style={{ width: "100%" }} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => adjustMutation.mutate()}>Save Adjustment</button>
              <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setAdjustProduct(null)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-panel">
        {inventory.length === 0 ? (
          <EmptyState message="No inventory records." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Threshold</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {inventory.map((item: InventoryRecord) => (
                  <tr key={item.productId}>
                    <td>{item.productName}</td>
                    <td>{item.sku ?? "—"}</td>
                    <td>{item.stockQuantity}</td>
                    <td>{item.lowStockThreshold}</td>
                    <td><StatusBadge status={item.stockQuantity <= 0 ? "out-of-stock" : item.stockQuantity <= item.lowStockThreshold ? "limited" : "in-stock"} /></td>
                    <td>
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { setAdjustProduct(item); setNewQty(item.stockQuantity); }}>Adjust</button>
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

export default function AdminInventoryPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Inventory">
          <InventoryContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
