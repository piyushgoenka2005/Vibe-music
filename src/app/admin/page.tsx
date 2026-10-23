"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  Clock3,
  Loader,
  CircleCheck,
  TriangleAlert,
  Ban,
  Plus,
  RefreshCw,
  ExternalLink,
  Calendar,
  ArrowRight,
  Database,
  Zap,
  CreditCard,
  Cloud,
  TrendingUp as _TrendingUp,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import {
  StatCard,
  StatusBadge,
  LoadingState,
  formatCurrency,
  formatDate,
} from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { adminFetchJson } from "@/lib/admin/adminFetch";
import type { AdminSession, DashboardStats, RevenueDataPoint } from "@/types/admin";
import type { Order } from "@/types/order";

/** recharts is code-split out of the dashboard's first paint. */
const DashboardRevenueChart = dynamic(() => import("@/components/admin/DashboardRevenueChart"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      style={{ height: 280, display: "grid", placeItems: "center", color: "var(--admin-muted)" }}
    >
      Loading chart…
    </div>
  ),
});

interface DashboardData {
  stats: DashboardStats;
  revenueChart: RevenueDataPoint[];
  recentOrders: Order[];
  recentCustomers: Array<{ uid: string; email: string; displayName: string; createdAt: string }>;
  lowStock: Array<{ id: string; name: string; stockQuantity: number; lowStockThreshold: number }>;
  outOfStock: Array<{ id: string; name: string; stockQuantity: number; lowStockThreshold: number }>;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
}

async function fetchDashboard(): Promise<DashboardData> {
  return adminFetchJson<DashboardData>("/api/admin/dashboard");
}

function DashboardContent({ admin }: { admin: AdminSession }) {
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(30);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboard,
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingState message="Loading dashboard metrics…" />;
  if (error || !data) {
    return (
      <ErrorState
        message="Unable to load dashboard data."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const { stats, revenueChart, recentOrders, recentCustomers, lowStock, outOfStock, topProducts } =
    data;

  // Filter chart data by selected day window
  const displayChartData = revenueChart.slice(-chartDays);

  const totalPeriodRevenue = displayChartData.reduce((acc, d) => acc + d.revenue, 0);
  const totalPeriodOrders = displayChartData.reduce((acc, d) => acc + d.orders, 0);
  const avgDailyRevenue =
    displayChartData.length > 0 ? Math.round(totalPeriodRevenue / displayChartData.length) : 0;
  const peakRevenueDay = displayChartData.reduce(
    (max, d) => (d.revenue > max.revenue ? d : max),
    displayChartData[0] || { date: "-", revenue: 0, orders: 0 },
  );

  const stockAlerts = [
    ...outOfStock.map((p) => ({ ...p, state: "out-of-stock" as const })),
    ...lowStock
      .filter((p) => !outOfStock.some((o) => o.id === p.id))
      .map((p) => ({ ...p, state: "limited" as const })),
  ].slice(0, 12);

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="admin-dashboard-root">
      {/* Personalized Welcome Header & Action Bar */}
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-welcome">
          <h1>Welcome back, {admin.displayName || admin.email.split("@")[0]}</h1>
          <p>
            <Calendar size={15} style={{ color: "var(--admin-accent)" }} />
            <span>{todayFormatted}</span>
            <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>•</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "#4ade80",
                fontWeight: 600,
                fontSize: "0.8rem",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#4ade80",
                  boxShadow: "0 0 6px #4ade80",
                }}
              />
              Live Storefront Connected
            </span>
          </p>
        </div>

        <div className="admin-dashboard-actions">
          <Link href="/admin/products/new" className="admin-btn-action admin-btn-action--primary">
            <Plus size={15} />
            <span>New Product</span>
          </Link>

          <Link href="/admin/orders" className="admin-btn-action">
            <ShoppingCart size={15} />
            <span>Orders</span>
          </Link>

          <Link href="/admin/inventory" className="admin-btn-action">
            <Package size={15} />
            <span>Inventory</span>
          </Link>

          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn-action">
            <ExternalLink size={15} />
            <span>Storefront</span>
          </a>

          <button
            type="button"
            className="admin-btn-action"
            onClick={() => void refetch()}
            disabled={isFetching}
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={15} className={isFetching ? "admin-spin" : ""} />
            <span>{isFetching ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* Actionable Quick Navigation Links with live counts */}
      <div className="admin-quick-links">
        <Link href="/admin/orders?status=pending" className="admin-quick-link">
          <span className="admin-quick-link__label">Pending orders</span>
          <span className="admin-quick-link__hint">
            {stats.pendingOrders} order{stats.pendingOrders === 1 ? "" : "s"} need attention
          </span>
        </Link>
        <Link href="/admin/orders?status=processing" className="admin-quick-link">
          <span className="admin-quick-link__label">Processing orders</span>
          <span className="admin-quick-link__hint">{stats.processingOrders} in fulfillment</span>
        </Link>
        <Link href="/admin/products?stock=low" className="admin-quick-link">
          <span className="admin-quick-link__label">Low stock items</span>
          <span className="admin-quick-link__hint">{stats.lowStockProducts} SKUs near limit</span>
        </Link>
        <Link href="/admin/products?stock=out" className="admin-quick-link">
          <span className="admin-quick-link__label">Out of stock</span>
          <span className="admin-quick-link__hint">
            {stats.outOfStockProducts} SKUs unavailable
          </span>
        </Link>
        <Link href="/admin/returns" className="admin-quick-link">
          <span className="admin-quick-link__label">Customer returns</span>
          <span className="admin-quick-link__hint">Moderate &amp; inspect</span>
        </Link>
        <Link href="/admin/products" className="admin-quick-link">
          <span className="admin-quick-link__label">Catalog manager</span>
          <span className="admin-quick-link__hint">Import &amp; bulk edit</span>
        </Link>
      </div>

      {/* Interactive Metric Stat Cards with Direct Navigation Links */}
      <div className="admin-stat-grid-premium">
        <StatCard
          label="Total Revenue"
          value={stats.totalRevenue}
          change={stats.revenueChangePercent}
          format="currency"
          accent="revenue"
          icon={IndianRupee}
          href="/admin/analytics"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          change={stats.ordersChangePercent}
          accent="orders"
          icon={ShoppingCart}
          href="/admin/orders"
        />
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers}
          accent="customers"
          icon={Users}
          href="/admin/customers"
        />
        <StatCard
          label="Active Products"
          value={stats.totalProducts}
          accent="products"
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders}
          accent="pending"
          icon={Clock3}
          href="/admin/orders?status=pending"
        />
        <StatCard
          label="Processing"
          value={stats.processingOrders}
          accent="processing"
          icon={Loader}
          href="/admin/orders?status=processing"
        />
        <StatCard
          label="Completed"
          value={stats.completedOrders}
          accent="completed"
          icon={CircleCheck}
          href="/admin/orders?status=delivered"
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelledOrders}
          accent="out-of-stock"
          icon={Ban}
          href="/admin/orders?status=cancelled"
        />
        <StatCard
          label="Low Stock"
          value={stats.lowStockProducts}
          accent="low-stock"
          icon={TriangleAlert}
          href="/admin/products?stock=low"
        />
        <StatCard
          label="Out of Stock"
          value={stats.outOfStockProducts}
          accent="out-of-stock"
          icon={Ban}
          href="/admin/products?stock=out"
        />
      </div>

      {/* Analytics Chart & Top Selling Products */}
      <div className="admin-grid-2-premium" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-panel-glass">
          <div
            className="admin-panel-glass__header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <h2 className="admin-panel-glass__title" style={{ margin: 0, border: "none" }}>
              Sales &amp; Volume Trends
            </h2>

            <div className="admin-panel-controls">
              {/* Metric Switcher */}
              <div
                style={{
                  display: "inline-flex",
                  borderRadius: 6,
                  border: "1px solid var(--admin-border)",
                  padding: 2,
                }}
              >
                <button
                  type="button"
                  className={`admin-tab-pill ${chartMetric === "revenue" ? "admin-tab-pill--active" : ""}`}
                  onClick={() => setChartMetric("revenue")}
                  style={{ border: "none" }}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  className={`admin-tab-pill ${chartMetric === "orders" ? "admin-tab-pill--active" : ""}`}
                  onClick={() => setChartMetric("orders")}
                  style={{ border: "none" }}
                >
                  Orders
                </button>
              </div>

              {/* Day Window Selector */}
              <div
                style={{
                  display: "inline-flex",
                  borderRadius: 6,
                  border: "1px solid var(--admin-border)",
                  padding: 2,
                }}
              >
                <button
                  type="button"
                  className={`admin-tab-pill ${chartDays === 7 ? "admin-tab-pill--active" : ""}`}
                  onClick={() => setChartDays(7)}
                  style={{ border: "none" }}
                >
                  7D
                </button>
                <button
                  type="button"
                  className={`admin-tab-pill ${chartDays === 14 ? "admin-tab-pill--active" : ""}`}
                  onClick={() => setChartDays(14)}
                  style={{ border: "none" }}
                >
                  14D
                </button>
                <button
                  type="button"
                  className={`admin-tab-pill ${chartDays === 30 ? "admin-tab-pill--active" : ""}`}
                  onClick={() => setChartDays(30)}
                  style={{ border: "none" }}
                >
                  30D
                </button>
              </div>
            </div>
          </div>

          {/* Quick period summary metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
              margin: "1rem 0",
              padding: "0.75rem",
              background: "hsla(var(--admin-hue), 20%, 12%, 0.4)",
              borderRadius: "10px",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>
                {chartDays}D Total
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
                {chartMetric === "revenue"
                  ? formatCurrency(totalPeriodRevenue)
                  : `${totalPeriodOrders.toLocaleString("en-IN")} orders`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>
                Daily Average
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
                {chartMetric === "revenue"
                  ? formatCurrency(avgDailyRevenue)
                  : `${Math.round(totalPeriodOrders / chartDays)}/day`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)" }}>
                Peak Day ({peakRevenueDay.date.slice(5)})
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--admin-accent)" }}>
                {chartMetric === "revenue"
                  ? formatCurrency(peakRevenueDay.revenue)
                  : `${peakRevenueDay.orders} orders`}
              </div>
            </div>
          </div>

          <div className="admin-panel-glass__body">
            <DashboardRevenueChart data={displayChartData} metric={chartMetric} />
          </div>

          <div className="admin-panel-footer">
            <Link href="/admin/analytics">
              <_TrendingUp size={14} />
              <span>Full Analytics &amp; Breakdown</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="admin-panel-glass">
          <div className="admin-panel-glass__header">
            <h2 className="admin-panel-glass__title" style={{ margin: 0, border: "none" }}>
              Top Selling Products
            </h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table-premium">
              <thead>
                <tr>
                  <th style={{ width: "38px" }}>#</th>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                      No sales data recorded in current period
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, index) => (
                    <tr key={p.name}>
                      <td>
                        <span
                          className={`admin-rank-pill admin-rank-pill--${index < 3 ? index + 1 : "default"}`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        <Link
                          href={`/admin/products?search=${encodeURIComponent(p.name)}`}
                          title={`Search ${p.name}`}
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{p.units}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--admin-accent)" }}>
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-panel-footer">
            <Link href="/admin/products">
              <span>Manage Products Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Stock Alerts */}
      <div className="admin-grid-2-premium">
        <div className="admin-panel-glass">
          <div className="admin-panel-glass__header">
            <h2 className="admin-panel-glass__title" style={{ margin: 0, border: "none" }}>
              Recent Orders
            </h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table-premium">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                      No recent orders found
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link
                          href={`/admin/orders?orderId=${encodeURIComponent(order.id)}`}
                          style={{ fontFamily: "monospace", fontWeight: 600 }}
                        >
                          {order.id.slice(0, 10)}…
                        </Link>
                      </td>
                      <td
                        style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {order.email}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-panel-footer">
            <Link href="/admin/orders">
              <span>View All Orders ({stats.totalOrders})</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="admin-panel-glass">
          <div className="admin-panel-glass__header">
            <h2 className="admin-panel-glass__title" style={{ margin: 0, border: "none" }}>
              Stock Alerts &amp; Critical Inventory
            </h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table-premium">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Min Limit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                      All products adequately stocked. No critical inventory alerts.
                    </td>
                  </tr>
                ) : (
                  stockAlerts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link
                          href={`/admin/products/${encodeURIComponent(p.id)}`}
                          style={{ fontWeight: 500 }}
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: p.stockQuantity === 0 ? "#ef4444" : "#f59e0b",
                          }}
                        >
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td>{p.lowStockThreshold}</td>
                      <td>
                        <Link
                          href={`/admin/inventory?search=${encodeURIComponent(p.name)}`}
                          className="admin-btn admin-btn--secondary"
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-panel-footer">
            <Link href="/admin/inventory">
              <span>Open Inventory Manager</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Customers & Growth */}
      <div className="admin-panel-glass" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel-glass__header">
          <h2 className="admin-panel-glass__title" style={{ margin: 0, border: "none" }}>
            Recent Customers &amp; Registered Shoppers
          </h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table-premium">
            <thead>
              <tr>
                <th style={{ width: "48px" }}></th>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Registered Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                    No customer registrations recorded
                  </td>
                </tr>
              ) : (
                recentCustomers.map((c) => {
                  const initial = (c.displayName || c.email || "?").charAt(0).toUpperCase();
                  return (
                    <tr key={c.uid}>
                      <td>
                        <span className="admin-avatar-initials">{initial}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <Link href={`/admin/customers?search=${encodeURIComponent(c.email)}`}>
                          {c.displayName || "Customer"}
                        </Link>
                      </td>
                      <td style={{ color: "var(--admin-text-secondary)" }}>{c.email}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td>
                        <Link
                          href={`/admin/orders?customerEmail=${encodeURIComponent(c.email)}`}
                          className="admin-btn admin-btn--secondary"
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                        >
                          View Orders
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-panel-footer">
          <Link href="/admin/customers">
            <span>View All Customers ({stats.totalCustomers})</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Operational Infrastructure Diagnostics */}
      <div className="admin-infra-grid">
        <div className="admin-infra-card">
          <div className="admin-infra-card__icon">
            <Database size={20} />
          </div>
          <div className="admin-infra-card__info">
            <div className="admin-infra-card__title">PostgreSQL Database</div>
            <div className="admin-infra-card__status">
              <span className="admin-infra-card__dot" />
              <span>Pool Connected &amp; Indexed</span>
            </div>
          </div>
        </div>

        <div className="admin-infra-card">
          <div className="admin-infra-card__icon">
            <Zap size={20} />
          </div>
          <div className="admin-infra-card__info">
            <div className="admin-infra-card__title">Redis Edge Cache</div>
            <div className="admin-infra-card__status">
              <span className="admin-infra-card__dot" />
              <span>Active Query Invalidation</span>
            </div>
          </div>
        </div>

        <div className="admin-infra-card">
          <div className="admin-infra-card__icon">
            <CreditCard size={20} />
          </div>
          <div className="admin-infra-card__info">
            <div className="admin-infra-card__title">Razorpay Payments</div>
            <div className="admin-infra-card__status">
              <span className="admin-infra-card__dot" />
              <span>Gateway Live &amp; Verified</span>
            </div>
          </div>
        </div>

        <div className="admin-infra-card">
          <div className="admin-infra-card__icon">
            <Cloud size={20} />
          </div>
          <div className="admin-infra-card__info">
            <div className="admin-infra-card__title">Asset Delivery CDN</div>
            <div className="admin-infra-card__status">
              <span className="admin-infra-card__dot" />
              <span>Edge POPs Synchronized</span>
            </div>
          </div>
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
          <DashboardContent admin={admin} />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
