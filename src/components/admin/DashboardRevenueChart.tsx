"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/components/admin/AdminUi";
import type { RevenueDataPoint } from "@/types/admin";

/**
 * Isolated so the dashboard can code-split recharts (~heavy) behind a
 * dynamic import instead of paying for it on first paint.
 * Visual styling only — same `data` contract as before.
 */
export default function DashboardRevenueChart({
  data,
  metric = "revenue",
}: {
  data: RevenueDataPoint[];
  metric?: "revenue" | "orders";
}) {
  const isOrders = metric === "orders";
  const strokeColor = isOrders ? "#f59e0b" : "#3b82f6";
  const gradientId = isOrders ? "adminOrdersFill" : "adminRevenueFill";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--admin-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--admin-border)" }}
          tickLine={false}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis
          tick={{ fill: "var(--admin-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) =>
            isOrders
              ? String(v)
              : v >= 100000
                ? `₹${(v / 100000).toFixed(1)}L`
                : v >= 1000
                  ? `₹${(v / 1000).toFixed(0)}k`
                  : `₹${v}`
          }
        />
        <Tooltip
          contentStyle={{
            background: "var(--admin-surface, #1e293b)",
            border: "1px solid var(--admin-border)",
            borderRadius: 10,
            boxShadow: "var(--admin-shadow-sm)",
            color: "var(--admin-text, #f8fafc)",
          }}
          labelStyle={{ color: "var(--admin-muted)", marginBottom: 4 }}
          itemStyle={{ color: "var(--admin-text, #f8fafc)" }}
          formatter={(value) => [
            isOrders
              ? `${Number(value ?? 0).toLocaleString("en-IN")} orders`
              : formatCurrency(Number(value ?? 0)),
            isOrders ? "Orders" : "Revenue",
          ]}
        />
        <Area
          type="monotone"
          dataKey={isOrders ? "orders" : "revenue"}
          stroke={strokeColor}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
