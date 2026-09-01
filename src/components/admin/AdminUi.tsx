import type { LucideIcon } from "lucide-react";

export type StatCardAccent =
  | "revenue"
  | "orders"
  | "customers"
  | "products"
  | "pending"
  | "processing"
  | "completed"
  | "low-stock"
  | "out-of-stock";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/_/g, " ");
  let variant = "muted";

  if (["paid", "delivered", "active", "approved", "in-stock", "confirmed", "published"].includes(status)) {
    variant = "success";
  } else if (["pending", "processing", "limited", "cod_pending", "scheduled"].includes(status)) {
    variant = "warning";
  } else if (["cancelled", "failed", "rejected", "out-of-stock", "archived", "refunded"].includes(status)) {
    variant = "danger";
  } else if (["shipped", "draft"].includes(status)) {
    variant = "info";
  }

  return (
    <span className={`admin-badge admin-badge--${variant}`}>
      {normalized}
    </span>
  );
}

export function StatCard({
  label,
  value,
  change,
  format = "number",
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  change?: number;
  format?: "number" | "currency";
  /** Visual accent only — does not change underlying stats. */
  accent?: StatCardAccent;
  /** Decorative icon — presentation only. */
  icon?: LucideIcon;
}) {
  const formatted =
    format === "currency"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(value)
      : value.toLocaleString("en-IN");

  return (
    <div className={`admin-stat-card${accent ? ` admin-stat-card--${accent}` : ""}`}>
      <div className="admin-stat-card__top">
        <div className="admin-stat-card__label">{label}</div>
        {Icon ? (
          <span className="admin-stat-card__icon" aria-hidden="true">
            <Icon size={18} strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <div className="admin-stat-card__value">{formatted}</div>
      {change !== undefined ? (
        <div
          className={`admin-stat-card__change admin-stat-card__change--${change >= 0 ? "up" : "down"}`}
        >
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs prior period
        </div>
      ) : null}
      <div className="admin-stat-card__spark" aria-hidden="true" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="admin-empty">{message}</div>;
}

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return <div className="admin-loading">{message}</div>;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
