"use client";

import { useRef, useState } from "react";
import type { BulkImportPreviewRow, BulkImportResult } from "@/types/catalog";
import { rowsToCsv } from "@/lib/csv";

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

  if (!open) return null;

  function buildFormData(confirm = false): FormData {
    const formData = new FormData();
    if (csvFile) formData.append("file", csvFile);
    if (zipFile) formData.append("zip", zipFile);
    if (confirm) formData.append("confirm", "true");
    return formData;
  }

  async function handlePreview(selectedCsv: File, selectedZip?: File | null) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCsvFile(selectedCsv);
    if (selectedZip !== undefined) setZipFile(selectedZip);

    const formData = new FormData();
    formData.append("file", selectedCsv);
    const zip = selectedZip ?? zipFile;
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

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-panel" style={{ maxWidth: 960, width: "95%", margin: "2rem auto" }}>
        <div className="admin-panel__header" style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Bulk Import Products</h2>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { reset(); onClose(); }}>
            Close
          </button>
        </div>
        <div className="admin-panel__body">
          <p style={{ marginBottom: "1rem" }}>
            Upload a CSV file and optionally a ZIP of product images.{" "}
            <a href="/product-import-template.csv" download className="admin-link">
              Download template
            </a>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
            <label>
              CSV file *
              <input
                ref={csvRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "block", marginTop: "0.25rem" }}
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handlePreview(selected);
                }}
              />
            </label>
            <label>
              Images ZIP (optional — matches image1–image5 filenames)
              <input
                ref={zipRef}
                type="file"
                accept=".zip,application/zip"
                style={{ display: "block", marginTop: "0.25rem" }}
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setZipFile(selected);
                  if (csvFile) handlePreview(csvFile, selected);
                }}
              />
            </label>
          </div>

          {error ? <p className="admin-form-error">{error}</p> : null}

          {result ? (
            <div style={{ marginTop: "1rem" }}>
              <p>Imported Successfully: {result.imported}</p>
              <p>Skipped: {result.skipped}</p>
              <p>Errors: {result.errors}</p>
              {result.failedRows.length > 0 ? (
                <button type="button" className="admin-btn admin-btn--secondary" onClick={exportFailedRows}>
                  Download Failed Rows CSV
                </button>
              ) : null}
            </div>
          ) : null}

          {preview.length > 0 && !result ? (
            <>
              <p style={{ marginTop: "1rem" }}>
                Preview: {preview.filter((r) => r.valid).length} valid,{" "}
                {preview.filter((r) => !r.valid).length} with errors
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
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={loading || preview.every((r) => !r.valid)}
                  onClick={handleConfirm}
                >
                  {loading ? "Importing…" : "Confirm Import"}
                </button>
                <button type="button" className="admin-btn admin-btn--secondary" onClick={reset}>
                  Reset
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
