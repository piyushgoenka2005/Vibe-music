"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatCard, StatusBadge, LoadingState, formatCurrency, formatDate } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import type { DashboardStats, RevenueDataPoint } from "@/types/admin";
import type { Order } from "@/types/order";

/** recharts is code-split out of the dashboard's first paint. */
const DashboardRevenueChart = dynamic(
  () => import("@/components/admin/DashboardRevenueChart"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        style={{ height: 280, display: "grid", placeItems: "center", color: "var(--admin-muted)" }}
      >
        Loading chart…
      </div>
    ),
  }
);

interface DashboardData {
  stats: DashboardStats;
  revenueChart: RevenueDataPoint[];
  recentOrders: Order[];
  recentCustomers: Array<{ uid: string; email: string; displayName: string; createdAt: string }>;
  lowStock: Array<{ id: string; name: string; stockQuantity: number; lowStockThreshold: number }>;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

function DashboardContent() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <LoadingState message="Loading dashboard…" />;
  if (error || !data) {
    return (
      <ErrorState
        message="Unable to load dashboard data."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const { stats, revenueChart, recentOrders, recentCustomers, lowStock, topProducts } = data;

  return (
    <div className="admin-dashboard-root">
      <div className="admin-stat-grid-premium">
        <StatCard label="Total Revenue" value={stats.totalRevenue} change={stats.revenueChangePercent} format="currency" />
        <StatCard label="Total Orders" value={stats.totalOrders} change={stats.ordersChangePercent} />
        <StatCard label="Total Customers" value={stats.totalCustomers} />
        <StatCard label="Total Products" value={stats.totalProducts} />
        <StatCard label="Pending Orders" value={stats.pendingOrders} />
        <StatCard label="Processing" value={stats.processingOrders} />
        <StatCard label="Completed" value={stats.completedOrders} />
        <StatCard label="Low Stock" value={stats.lowStockProducts} />
        <StatCard label="Out of Stock" value={stats.outOfStockProducts} />
      </div>

      <div className="admin-grid-2-premium" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-panel-glass">
          <div className="admin-panel-glass__header">
            <h2 className="admin-panel-glass__title">Revenue (30 days)</h2>
          </div>
          <div className="admin-panel-glass__body">
            <DashboardRevenueChart data={revenueChart} />
          </div>
        </div>

        <div className="admin-panel-glass">
          <div className="admin-panel-glass__header">
            <h2 className="admin-panel-glass__title">Top Products</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table-premium">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.units}</td>
                    <td>{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-grid-2-premium">
        <div className="admin-panel-glass">
          <div className="admin-panel-glass__header">
            <h2 className="admin-panel-glass__title">Recent Orders</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table-premium">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders?orderId=${encodeURIComponent(order.id)}`}>
                        {order.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td>{order.email}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel-glass">
          <div className="admin-panel-glass__header">
            <h2 className="admin-panel-glass__title">Low Stock Alerts</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table-premium">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                      All products adequately stocked
                    </td>
                  </tr>
                ) : (
                  lowStock.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/admin/products/${encodeURIComponent(p.id)}`}>
                          {p.name}
                        </Link>
                      </td>
                      <td><StatusBadge status={p.stockQuantity <= 0 ? "out-of-stock" : "limited"} /> {p.stockQuantity}</td>
                      <td>{p.lowStockThreshold}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-panel-glass" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel-glass__header">
          <h2 className="admin-panel-glass__title">Recent Customers</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table-premium">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentCustomers.map((c) => (
                <tr key={c.uid}>
                  <td>
                    <Link href={`/admin/customers?search=${encodeURIComponent(c.email)}`}>
                      {c.displayName || "—"}
                    </Link>
                  </td>
                  <td>{c.email}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Dashboard">
          <DashboardContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
