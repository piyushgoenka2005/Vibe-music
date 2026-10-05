"use client";

import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson } from "@/components/admin/AdminQueryState";
import type { CompareAnalyticsSummary } from "@/types/compare";

function CompareAnalyticsPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-compare-analytics"],
    queryFn: async () => {
      return adminFetchJson<{ analytics: CompareAnalyticsSummary }>("/api/admin/compare/analytics");
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load compare analytics."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }
  const a = data?.analytics;

  return (
    <div className="admin-panel">
      <div className="admin-panel__body">
        <p>Total compare events: {a?.totalEvents ?? 0}</p>
        <p>Adds: {a?.adds ?? 0}</p>
        <p>Removes: {a?.removes ?? 0}</p>
        <p>Shares: {a?.shares ?? 0}</p>
        <p>Share views: {a?.shareViews ?? 0}</p>
        <p>Exports: {a?.exports ?? 0}</p>
        {a?.topProducts?.length ? (
          <>
            <h3 style={{ marginTop: "1rem" }}>Top compared products</h3>
            <ul>
              {a.topProducts.map((p: { productId: string; name: string; count: number }) => (
                <li key={p.productId}>
                  {p.name} — {p.count}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminComparePage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Product compare">
          <CompareAnalyticsPanel />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
