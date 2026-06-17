"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatCard, StatusBadge, LoadingState, formatCurrency, formatDate } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import type { DashboardStats, RevenueDataPoint } from "@/types/admin";
import type { Order } from "@/types/order";

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
    <>
      <div className="admin-stat-grid">
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

      <div className="admin-grid-2" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Revenue (30 days)</h2>
          </div>
          <div className="admin-panel__body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#141416", border: "1px solid #2a2a2e", borderRadius: 8 }}
                  labelStyle={{ color: "#fafafa" }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--brand-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Top Products</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
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

      <div className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Recent Orders</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                    <td>{order.id.slice(0, 8)}…</td>
                    <td>{order.email}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Low Stock Alerts</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                      <td>{p.name}</td>
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

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Recent Customers</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
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
                  <td>{c.displayName || "—"}</td>
                  <td>{c.email}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
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
