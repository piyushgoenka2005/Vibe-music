"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import type { BulkImportPreviewRow, BulkImportResult } from "@/types/catalog";
import { rowsToCsv } from "@/lib/csv";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function BulkImportModal({
  open,
  onClose,
  onComplete,
}: BulkImportModalProps) {
  const csvRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BulkImportPreviewRow[]>([]);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  const dialogRef = useDialogA11y(open, handleClose);

  if (!open) return null;

  function buildFormData(confirm = false): FormData {
    const formData = new FormData();
    if (csvFile) formData.append("file", csvFile);
    if (zipFile) formData.append("zip", zipFile);
    if (confirm) formData.append("confirm", "true");
    return formData;
  }

  async function handlePreview(selectedCsv?: File | null, selectedZip?: File | null) {
    const csv = selectedCsv ?? csvFile;
    if (!csv) {
      setError("Choose a CSV file first, then click Preview import.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCsvFile(csv);
    if (selectedZip !== undefined) setZipFile(selectedZip);

    const formData = new FormData();
    formData.append("file", csv);
    const zip = selectedZip !== undefined ? selectedZip : zipFile;
    if (zip) formData.append("zip", zip);

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      setPreview(data.preview ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
      setPreview([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!csvFile) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: buildFormData(true),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data.result);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function exportFailedRows() {
    if (!result?.failedRows.length) return;
    const headers = [
      "rowNumber",
      "name",
      "brand",
      "category",
      "price",
      "sku",
      "reason",
    ];
    const rows = result.failedRows.map((row) => ({
      rowNumber: String(row.rowNumber),
      name: row.name,
      brand: row.brand,
      category: row.category,
      price: String(row.price),
      sku: row.sku ?? row.generatedSku ?? "",
      reason: row.reason,
    }));
    const csv = rowsToCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-failed-rows.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setPreview([]);
    setResult(null);
    setCsvFile(null);
    setZipFile(null);
    setError(null);
    if (csvRef.current) csvRef.current.value = "";
    if (zipRef.current) zipRef.current.value = "";
  }

  const validCount = preview.filter((r) => r.valid).length;
  const errorCount = preview.filter((r) => !r.valid).length;
  const canConfirm = preview.length > 0 && validCount > 0 && !result;

  return (
    <div
      ref={dialogRef as RefObject<HTMLDivElement>}
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-import-title"
    >
      <div className="admin-panel" style={{ maxWidth: 960, width: "95%", margin: "2rem auto" }}>
        <div className="admin-panel__header" style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 id="bulk-import-title">Bulk Import Products</h2>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => {
              reset();
              handleClose();
            }}
          >
            Close
          </button>
        </div>
        <div className="admin-panel__body">
          <p style={{ marginBottom: "0.5rem" }}>
            Import products from a CSV. Images ZIP is optional.{" "}
            <a href="/product-import-template.csv" download className="admin-link">
              Download template
            </a>
          </p>
          <ol
            style={{
              margin: "0 0 1.25rem",
              paddingLeft: "1.25rem",
              color: "var(--admin-muted)",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            <li>Choose your CSV file (required).</li>
            <li>Optionally choose a ZIP of images (image1–image5 filenames).</li>
            <li>Click <strong>Preview import</strong>, review the table, then <strong>Confirm import</strong>.</li>
          </ol>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginBottom: "1.25rem",
              padding: "1rem",
              border: "1px solid var(--admin-border)",
              borderRadius: 8,
              background: "var(--admin-surface, transparent)",
            }}
          >
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="bulk-import-csv-trigger">1. CSV file (required)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                <input
                  ref={csvRef}
                  id="bulk-import-csv"
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    setCsvFile(selected);
                    setPreview([]);
                    setResult(null);
                    setError(null);
                  }}
                />
                <button
                  id="bulk-import-csv-trigger"
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={loading}
                  onClick={() => csvRef.current?.click()}
                >
                  Choose CSV file
                </button>
                <span style={{ fontSize: "0.875rem", color: csvFile ? "inherit" : "var(--admin-muted)" }}>
                  {csvFile ? csvFile.name : "No CSV selected"}
                </span>
              </div>
            </div>

            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="bulk-import-zip-trigger">2. Images ZIP (optional)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                <input
                  ref={zipRef}
                  id="bulk-import-zip"
                  type="file"
                  accept=".zip,application/zip"
                  hidden
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    setZipFile(selected);
                    setPreview([]);
                    setResult(null);
                  }}
                />
                <button
                  id="bulk-import-zip-trigger"
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={loading}
                  onClick={() => zipRef.current?.click()}
                >
                  Choose images ZIP
                </button>
                <span style={{ fontSize: "0.875rem", color: zipFile ? "inherit" : "var(--admin-muted)" }}>
                  {zipFile ? zipFile.name : "No ZIP selected"}
                </span>
                {zipFile ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    disabled={loading}
                    onClick={() => {
                      setZipFile(null);
                      if (zipRef.current) zipRef.current.value = "";
                      setPreview([]);
                      setResult(null);
                    }}
                  >
                    Clear ZIP
                  </button>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginTop: "0.25rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={loading || !csvFile}
                onClick={() => void handlePreview()}
              >
                {loading && !result ? "Preparing preview…" : "Preview import"}
              </button>
              {(csvFile || zipFile || preview.length > 0) && !result ? (
                <button type="button" className="admin-btn admin-btn--ghost" disabled={loading} onClick={reset}>
                  Clear selection
                </button>
              ) : null}
            </div>
            {!csvFile ? (
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--admin-muted)" }}>
                Select a CSV file to enable Preview import.
              </p>
            ) : null}
          </div>

          {error ? <p className="admin-form-error">{error}</p> : null}

          {result ? (
            <div style={{ marginTop: "1rem" }}>
              <p>
                <strong>Import finished</strong>
              </p>
              <p>Imported successfully: {result.imported}</p>
              <p>Skipped: {result.skipped}</p>
              <p>Errors: {result.errors}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
                {result.failedRows.length > 0 ? (
                  <button type="button" className="admin-btn admin-btn--secondary" onClick={exportFailedRows}>
                    Download failed rows CSV
                  </button>
                ) : null}
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={() => {
                    reset();
                  }}
                >
                  Import another file
                </button>
              </div>
            </div>
          ) : null}

          {preview.length > 0 && !result ? (
            <>
              <p style={{ marginTop: "0.5rem" }}>
                Preview ready: {validCount} valid, {errorCount} with errors
              </p>
              <div className="admin-table-wrap" style={{ maxHeight: 320, overflow: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Name</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        <td>{row.name}</td>
                        <td>{row.brand}</td>
                        <td>{row.category}</td>
                        <td>{row.price}</td>
                        <td>
                          {row.valid ? (
                            <span style={{ color: "var(--admin-success)" }}>Valid</span>
                          ) : (
                            <span style={{ color: "var(--admin-danger)" }}>{row.errors.join("; ")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={loading || !canConfirm}
                  onClick={handleConfirm}
                >
                  {loading ? "Importing…" : `Confirm import (${validCount} products)`}
                </button>
                <button type="button" className="admin-btn admin-btn--secondary" disabled={loading} onClick={reset}>
                  Start over
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
