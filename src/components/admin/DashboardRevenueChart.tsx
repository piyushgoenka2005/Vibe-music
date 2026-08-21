"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
 */
export default function DashboardRevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
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
  );
}
