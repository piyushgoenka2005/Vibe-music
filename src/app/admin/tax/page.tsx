"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Receipt, Percent, CheckCircle2, ShieldCheck, Info } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson } from "@/components/admin/AdminQueryState";
import type { HsnTaxCategory } from "@/app/api/admin/tax/route";

function TaxContent() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-tax"],
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    queryFn: async () => {
      return adminFetchJson<{
        taxCategories: HsnTaxCategory[];
        stats: {
          totalHsnCodes: number;
          standardGstRate: string;
          exemptRate: string;
          hsnClassifiedCatalogPercent: number;
        };
      }>("/api/admin/tax");
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load GST tax categories & HSN codes."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const taxCategories = data?.taxCategories ?? [];
  const stats = data?.stats ?? {
    totalHsnCodes: taxCategories.length,
    standardGstRate: "18%",
    exemptRate: "0%",
    hsnClassifiedCatalogPercent: 100,
  };

  return (
    <div className="admin-page">
      {/* KPI Stats */}
      <div className="admin-grid admin-grid--4" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">HSN Classifications</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}
            >
              <Receipt size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.totalHsnCodes} Active Codes</div>
          <div className="admin-kpi__sub">Indian GST tariff headings</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Instruments Standard Rate</span>
            <span
              className="admin-kpi__icon"
              style={{
                background: "var(--admin-kpi-orders-soft)",
                color: "var(--admin-kpi-orders)",
              }}
            >
              <Percent size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.standardGstRate}</div>
          <div className="admin-kpi__sub">CGST (9%) + SGST (9%) / IGST (18%)</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Catalog HSN Mapping</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-success-soft)", color: "var(--admin-success)" }}
            >
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.hsnClassifiedCatalogPercent}%</div>
          <div className="admin-kpi__sub">Every product mapped to HSN</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">B2B Invoice Compliance</span>
            <span
              className="admin-kpi__icon"
              style={{
                background: "var(--admin-kpi-customers-soft)",
                color: "var(--admin-kpi-customers)",
              }}
            >
              <ShieldCheck size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">GSTIN Validated</div>
          <div className="admin-kpi__sub">Tax invoices generated automatically</div>
        </div>
      </div>

      {/* Tax Table Card */}
      <div
        className="admin-card"
        style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}
      >
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--admin-border)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
            Harmonized System of Nomenclature (HSN) & GST Tax Schedule
          </h2>
          <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            Governing tax slabs applied to customer invoices based on product classification and
            delivery destination.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>HSN Code</th>
                <th>Classification Name & Description</th>
                <th>Total GST</th>
                <th>Intra-State (CGST + SGST)</th>
                <th>Inter-State (IGST)</th>
                <th>Mapped Catalog Items</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {taxCategories.map((item) => (
                <tr key={item.hsnCode}>
                  <td>
                    <code
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        background: "var(--admin-surface-2)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        color: "var(--admin-accent)",
                      }}
                    >
                      {item.hsnCode}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{item.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                      {item.description}
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--primary" style={{ fontWeight: 700 }}>
                      {item.gstRate}%
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    {item.cgstRate}% + {item.sgstRate}%
                  </td>
                  <td style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{item.igstRate}%</td>
                  <td>
                    <span style={{ fontSize: "0.875rem" }}>{item.itemCount} SKUs</span>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--success">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Guidance Banner */}
      <div
        className="admin-card"
        style={{
          background: "var(--admin-surface-2)",
          border: "1px solid var(--admin-border)",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <Info size={20} color="var(--admin-accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.9375rem", fontWeight: 600 }}>
              Indian GST Invoicing Rules for Music Instruments & Pro Gear
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "0.8125rem",
                color: "var(--admin-muted)",
                lineHeight: 1.5,
              }}
            >
              All shipments from Vibe Music originate from Maharashtra (State Code 27). For
              intra-state deliveries within Maharashtra, CGST (9%) and SGST (9%) are levied. For
              inter-state deliveries across all other Indian States and Union Territories, IGST
              (18%) is automatically calculated and shown itemized on the downloadable PDF tax
              invoices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTaxPage() {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell admin={session} title="Taxation & GST Rates">
          <TaxContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
