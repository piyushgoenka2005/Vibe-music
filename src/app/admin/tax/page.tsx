"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Receipt,
  Percent,
  CheckCircle2,
  ShieldCheck,
  Info,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import { useToastStore } from "@/store/toastStore";
import type { HsnTaxCategory } from "@/app/api/admin/tax/route";

interface TaxModalState {
  mode: "create" | "edit";
  hsnCode: string;
  name: string;
  description: string;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  isActive: boolean;
  itemCount: number;
}

const EMPTY_TAX_FORM: TaxModalState = {
  mode: "create",
  hsnCode: "",
  name: "",
  description: "",
  gstRate: 18,
  cgstRate: 9,
  sgstRate: 9,
  igstRate: 18,
  isActive: true,
  itemCount: 0,
};

function TaxContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<TaxModalState | null>(null);
  const [deleteConfirmHsn, setDeleteConfirmHsn] = useState<HsnTaxCategory | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-tax"],
    placeholderData: keepPreviousData,
    staleTime: 60_000,
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

  const saveMutation = useMutation({
    mutationFn: async (form: TaxModalState) => {
      if (form.mode === "create") {
        await adminMutateJson("/api/admin/tax", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hsnCode: form.hsnCode.trim(),
            name: form.name.trim(),
            description: form.description.trim(),
            gstRate: form.gstRate,
            cgstRate: form.cgstRate,
            sgstRate: form.sgstRate,
            igstRate: form.igstRate,
            isActive: form.isActive,
            itemCount: form.itemCount,
          }),
        });
      } else {
        await adminMutateJson("/api/admin/tax", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hsnCode: form.hsnCode.trim(),
            name: form.name.trim(),
            description: form.description.trim(),
            gstRate: form.gstRate,
            cgstRate: form.cgstRate,
            sgstRate: form.sgstRate,
            igstRate: form.igstRate,
            isActive: form.isActive,
            itemCount: form.itemCount,
          }),
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tax"] });
      setModalState(null);
      useToastStore
        .getState()
        .show(
          variables.mode === "create"
            ? `HSN Code ${variables.hsnCode} created successfully!`
            : `HSN Code ${variables.hsnCode} updated successfully!`,
          "success",
        );
    },
    onError: (err) => {
      useToastStore
        .getState()
        .show(err instanceof Error ? err.message : "Failed to save HSN tax rate", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (hsnCode: string) => {
      await adminMutateJson(`/api/admin/tax?hsnCode=${encodeURIComponent(hsnCode)}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, hsnCode) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tax"] });
      setDeleteConfirmHsn(null);
      useToastStore.getState().show(`HSN Code ${hsnCode} deleted successfully!`, "success");
    },
    onError: (err) => {
      useToastStore
        .getState()
        .show(err instanceof Error ? err.message : "Failed to delete HSN tax rate", "error");
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

  function handleGstRateChange(newGst: number) {
    if (!modalState) return;
    setModalState({
      ...modalState,
      gstRate: newGst,
      cgstRate: newGst / 2,
      sgstRate: newGst / 2,
      igstRate: newGst,
    });
  }

  function handleSaveModal() {
    if (!modalState) return;
    if (!modalState.hsnCode.trim()) {
      useToastStore.getState().show("HSN Code is required", "error");
      return;
    }
    if (!modalState.name.trim()) {
      useToastStore.getState().show("Classification Name is required", "error");
      return;
    }
    saveMutation.mutate(modalState);
  }

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
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--admin-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
              Harmonized System of Nomenclature (HSN) & GST Tax Schedule
            </h2>
            <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
              Governing tax slabs applied to customer invoices based on product classification and
              delivery destination.
            </p>
          </div>

          {canWrite && (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => setModalState({ ...EMPTY_TAX_FORM })}
            >
              <Plus size={16} /> Add HSN Tax Rate
            </button>
          )}
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
                {canWrite && <th style={{ textAlign: "right" }}>Actions</th>}
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
                    <span
                      className={`admin-badge ${item.isActive ? "admin-badge--success" : "admin-badge--neutral"}`}
                    >
                      {item.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  {canWrite && (
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.25rem" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          title="Edit HSN Tax Rate"
                          style={{ padding: "0.25rem" }}
                          onClick={() =>
                            setModalState({
                              mode: "edit",
                              hsnCode: item.hsnCode,
                              name: item.name,
                              description: item.description,
                              gstRate: item.gstRate,
                              cgstRate: item.cgstRate,
                              sgstRate: item.sgstRate,
                              igstRate: item.igstRate,
                              isActive: item.isActive,
                              itemCount: item.itemCount,
                            })
                          }
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          title="Delete HSN Tax Rate"
                          style={{ padding: "0.25rem 0.5rem" }}
                          onClick={() => setDeleteConfirmHsn(item)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {taxCategories.length === 0 && (
                <tr>
                  <td
                    colSpan={canWrite ? 8 : 7}
                    style={{ textAlign: "center", color: "var(--admin-muted)", padding: "2rem" }}
                  >
                    No HSN tax categories found. Click &ldquo;Add HSN Tax Rate&rdquo; to add one.
                  </td>
                </tr>
              )}
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

      {/* Add / Edit Modal */}
      {modalState && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="admin-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 1rem" }}>
              {modalState.mode === "create"
                ? "Add New HSN Tax Rate"
                : `Edit HSN Tax Rate (${modalState.hsnCode})`}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    HSN Code
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: "100%", fontFamily: "monospace" }}
                    placeholder="e.g. 9202"
                    value={modalState.hsnCode}
                    disabled={modalState.mode === "edit"}
                    onChange={(e) => setModalState({ ...modalState, hsnCode: e.target.value })}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    GST Slab Rate (%)
                  </label>
                  <select
                    className="admin-select"
                    style={{ width: "100%" }}
                    value={modalState.gstRate}
                    onChange={(e) => handleGstRateChange(Number(e.target.value))}
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Concessional)</option>
                    <option value={12}>12% (Standard Low)</option>
                    <option value={18}>18% (Instruments Standard)</option>
                    <option value={28}>28% (Luxury / High Tier)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Classification Heading Name
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%" }}
                  placeholder="e.g. Acoustic & String Instruments"
                  value={modalState.name}
                  onChange={(e) => setModalState({ ...modalState, name: e.target.value })}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Description / Harmonized Scope
                </label>
                <textarea
                  className="admin-input"
                  rows={2}
                  style={{ width: "100%", resize: "vertical" }}
                  placeholder="e.g. Guitars, violins, harps, ukuleles, cellos and mandolins"
                  value={modalState.description}
                  onChange={(e) => setModalState({ ...modalState, description: e.target.value })}
                />
              </div>

              {/* Calculated Tax Breakdown */}
              <div
                style={{
                  background: "var(--admin-surface-2)",
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  fontSize: "0.8125rem",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Tax Breakdown:</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--admin-muted)",
                  }}
                >
                  <span>
                    Intra-State: CGST ({modalState.cgstRate}%) + SGST ({modalState.sgstRate}%)
                  </span>
                  <span>Inter-State: IGST ({modalState.igstRate}%)</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="taxActiveCheckbox"
                  checked={modalState.isActive}
                  onChange={(e) => setModalState({ ...modalState, isActive: e.target.checked })}
                />
                <label
                  htmlFor="taxActiveCheckbox"
                  style={{ fontSize: "0.875rem", cursor: "pointer" }}
                >
                  HSN Tax Code Active & Enabled for Invoicing
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setModalState(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={saveMutation.isPending}
                  onClick={handleSaveModal}
                >
                  {saveMutation.isPending
                    ? "Saving..."
                    : modalState.mode === "create"
                      ? "Add HSN Code"
                      : "Update HSN Code"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmHsn && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="admin-card"
            style={{
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                margin: "0 0 0.5rem",
                color: "var(--admin-danger)",
              }}
            >
              Delete HSN Tax Code?
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--admin-muted)",
                margin: "0 0 1.25rem",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete HSN Code <strong>{deleteConfirmHsn.hsnCode}</strong> (
              {deleteConfirmHsn.name})? This cannot be undone.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setDeleteConfirmHsn(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmHsn.hsnCode)}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete HSN Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTaxPage() {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell admin={session} title="Taxation & GST Rates">
          <TaxContent
            canWrite={
              session.role === "super_admin" ||
              (session.permissions ?? []).includes("settings:write")
            }
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
