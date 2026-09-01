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
export default function DashboardRevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--admin-kpi-revenue, #3b82f6)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--admin-kpi-revenue, #3b82f6)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--admin-border)"
          vertical={false}
        />
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
        />
        <Tooltip
          contentStyle={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: 10,
            boxShadow: "var(--admin-shadow-sm)",
            color: "var(--admin-text)",
          }}
          labelStyle={{ color: "var(--admin-muted)", marginBottom: 4 }}
          itemStyle={{ color: "var(--admin-text)" }}
          formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--admin-kpi-revenue, #3b82f6)"
          strokeWidth={2.5}
          fill="url(#adminRevenueFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "var(--admin-kpi-revenue, #3b82f6)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
