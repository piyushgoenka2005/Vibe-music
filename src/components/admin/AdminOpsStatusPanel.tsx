"use client";

import { useQuery } from "@tanstack/react-query";

type OpsItem = {
  key: string;
  label: string;
  status: "ok" | "missing" | "partial";
  tier: "required" | "recommended" | "optional";
  detail: string;
};

function statusLabel(status: OpsItem["status"]): string {
  if (status === "ok") return "Configured";
  if (status === "partial") return "Partial";
  return "Missing";
}

function statusClass(status: OpsItem["status"]): string {
  if (status === "ok") return "admin-ops-status__badge admin-ops-status__badge--ok";
  if (status === "partial")
    return "admin-ops-status__badge admin-ops-status__badge--partial";
  return "admin-ops-status__badge admin-ops-status__badge--missing";
}

export default function AdminOpsStatusPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-ops-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ops-status");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        environment: string;
        demoPaymentsAllowed: boolean;
        items: OpsItem[];
      }>;
    },
  });

  if (isLoading) {
    return (
      <div className="admin-ops-status">
        <p className="admin-ops-status__meta">Loading integration status…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="admin-ops-status">
        <p className="admin-ops-status__meta" role="alert">
          Could not load ops status. Check admin permissions.
        </p>
      </div>
    );
  }

  const requiredMissing = data.items.filter(
    (item) => item.tier === "required" && item.status !== "ok"
  ).length;

  return (
    <div className="admin-ops-status">
      <div className="admin-ops-status__header">
        <h2 className="admin-ops-status__title">Production integrations</h2>
        <p className="admin-ops-status__meta">
          Environment: <strong>{data.environment}</strong>
          {data.demoPaymentsAllowed ? " · Demo payments allowed" : null}
          {requiredMissing > 0
            ? ` · ${requiredMissing} required item(s) incomplete`
            : " · Required secrets look set"}
        </p>
        <p className="admin-ops-status__meta">
          Secrets are never shown here. See{" "}
          <code>docs/ops/GO_LIVE.md</code> and{" "}
          <code>docs/ops/DEPLOYMENT.md</code>.
        </p>
      </div>

      <ul className="admin-ops-status__list">
        {data.items.map((item) => (
          <li key={item.key} className="admin-ops-status__row">
            <div className="admin-ops-status__row-main">
              <span className="admin-ops-status__label">{item.label}</span>
              <span className="admin-ops-status__tier">{item.tier}</span>
              <span className={statusClass(item.status)}>
                {statusLabel(item.status)}
              </span>
            </div>
            <p className="admin-ops-status__detail">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
