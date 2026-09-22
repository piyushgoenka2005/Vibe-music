"use client";

import { useCallback, useMemo, useRef, useState, type DragEvent, type RefObject } from "react";
import type { BulkImportPreviewRow, BulkImportResult } from "@/types/catalog";
import {
  VIBEMUSIC_BULK_COLUMN_COUNT,
  VIBEMUSIC_BULK_IMPORT_TITLE,
  VIBEMUSIC_BULK_REQUIRED_COLUMNS,
  VIBEMUSIC_BULK_TEMPLATE_CSV_FILE,
  VIBEMUSIC_BULK_TEMPLATE_CSV_URL,
  VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE,
  VIBEMUSIC_BULK_TEMPLATE_XLSX_URL,
  VIBEMUSIC_BULK_FAILED_ROWS_FILENAME,
} from "@/lib/admin/bulkImportTemplate";
import { failedImportRowsToBulkCsv } from "@/lib/admin/bulkImportTemplate";
import {
  DEFAULT_BULK_IMPORT_OPTIONS,
  type BulkImportOptions,
  type BulkImportPreviewSummary,
  type BulkImportWizardStep,
} from "@/lib/admin/bulkImportTypes";
import {
  MAX_IMPORT_ROWS,
  MAX_SHEET_BYTES,
  MAX_ZIP_BYTES,
  validateSpreadsheetFile,
  validateZipFile,
} from "@/lib/admin/bulkImportValidation";
import { BULK_IMPORT_PREVIEW_TABLE_LIMIT } from "@/lib/admin/bulkImportResponse";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";
import "./bulk-import.css";

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type PreviewFilter = "all" | "valid" | "errors" | "updates" | "skips";

const STEPS: Array<{ id: BulkImportWizardStep; label: string }> = [
  { id: "upload", label: "Upload" },
  { id: "options", label: "Options" },
  { id: "preview", label: "Preview" },
  { id: "complete", label: "Results" },
];

const MAX_SHEET_MB = Math.round(MAX_SHEET_BYTES / (1024 * 1024));
const MAX_ZIP_MB = Math.round(MAX_ZIP_BYTES / (1024 * 1024));

function parseApiError(
  res: Response,
  data: Record<string, unknown> | null,
  fallback: string,
): string {
  const message = typeof data?.error === "string" ? data.error : null;
  if (message) return message;
  if (res.status >= 500) return "Import service is temporarily unavailable. Try again shortly.";
  return fallback;
}

async function readJsonResponse(res: Response): Promise<{
  data: Record<string, unknown> | null;
  text: string;
}> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return { data: (await res.json()) as Record<string, unknown>, text: "" };
  }
  const text = await res.text();
  return { data: null, text };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function rowActionLabel(row: BulkImportPreviewRow): string {
  if (!row.valid) return "Error";
  if (row.action === "update") return "Update";
  if (row.action === "skip") return "Skip";
  return "Create";
}

function rowActionClass(row: BulkImportPreviewRow): string {
  if (!row.valid) return "bulk-import-badge bulk-import-badge--error";
  if (row.action === "update") return "bulk-import-badge bulk-import-badge--update";
  if (row.action === "skip") return "bulk-import-badge bulk-import-badge--skip";
  return "bulk-import-badge bulk-import-badge--create";
}

export default function BulkImportModal({ open, onClose, onComplete }: BulkImportModalProps) {
  const sheetRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<BulkImportWizardStep>("upload");
  const [preview, setPreview] = useState<BulkImportPreviewRow[]>([]);
  const [summary, setSummary] = useState<BulkImportPreviewSummary | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [options, setOptions] = useState<BulkImportOptions>(DEFAULT_BULK_IMPORT_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filter, setFilter] = useState<PreviewFilter>("all");
  const [search, setSearch] = useState("");
  const [sheetDragActive, setSheetDragActive] = useState(false);
  const [zipDragActive, setZipDragActive] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setPreview([]);
    setSummary(null);
    setResult(null);
    setOptions(DEFAULT_BULK_IMPORT_OPTIONS);
    setSheetFile(null);
    setZipFile(null);
    setError(null);
    setConfirmOpen(false);
    setFilter("all");
    setSearch("");
    if (sheetRef.current) sheetRef.current.value = "";
    if (zipRef.current) zipRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    reset();
    onClose();
  }, [loading, onClose, reset]);

  const dialogRef = useDialogA11y(open, handleClose);

  const importableCount = useMemo(
    () => preview.filter((row) => row.valid && row.action !== "skip").length,
    [preview],
  );

  const filteredPreview = useMemo(() => {
    const query = search.trim().toLowerCase();
    return preview.filter((row) => {
      if (filter === "valid" && !row.valid) return false;
      if (filter === "errors" && row.valid) return false;
      if (filter === "updates" && row.action !== "update") return false;
      if (filter === "skips" && row.action !== "skip") return false;
      if (!query) return true;
      const haystack = [
        row.name,
        row.brand,
        row.category,
        row.sku,
        row.generatedSku,
        row.errors.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, preview, search]);

  const visiblePreview = useMemo(
    () => filteredPreview.slice(0, BULK_IMPORT_PREVIEW_TABLE_LIMIT),
    [filteredPreview],
  );

  const previewTableTruncated = filteredPreview.length > BULK_IMPORT_PREVIEW_TABLE_LIMIT;

  if (!open) return null;

  function buildFormData(confirm = false): FormData {
    const formData = new FormData();
    if (sheetFile) formData.append("file", sheetFile);
    if (zipFile) formData.append("zip", zipFile);
    formData.append("options", JSON.stringify(options));
    if (confirm) formData.append("confirm", "true");
    return formData;
  }

  function assignSheet(selected: File | null) {
    setPreview([]);
    setSummary(null);
    setResult(null);
    setError(null);
    setStep("upload");
    if (!selected) {
      setSheetFile(null);
      return;
    }
    const validationError = validateSpreadsheetFile(selected);
    if (validationError) {
      setError(validationError);
      setSheetFile(null);
      if (sheetRef.current) sheetRef.current.value = "";
      return;
    }
    setSheetFile(selected);
  }

  function assignZip(selected: File | null) {
    setPreview([]);
    setSummary(null);
    setResult(null);
    if (!selected) {
      setZipFile(null);
      return;
    }
    const validationError = validateZipFile(selected);
    if (validationError) {
      setError(validationError);
      setZipFile(null);
      if (zipRef.current) zipRef.current.value = "";
      return;
    }
    setZipFile(selected);
  }

  async function runPreview() {
    if (!sheetFile) {
      setError("Choose the Vibe Music bulk template (.xlsx or .csv) before continuing.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setStep("preview");

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: buildFormData(false),
      });
      const { data, text } = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(parseApiError(res, data, text ? "Preview failed" : "Preview failed"));
      }

      setPreview((data?.preview as BulkImportPreviewRow[] | undefined) ?? []);
      setSummary((data?.summary as BulkImportPreviewSummary | undefined) ?? null);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
      setPreview([]);
      setSummary(null);
      setStep("options");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!sheetFile) return;
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    setStep("importing");

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: buildFormData(true),
      });
      const { data, text } = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(parseApiError(res, data, text ? "Import failed" : "Import failed"));
      }

      setResult((data?.result as BulkImportResult | undefined) ?? null);
      setStep("complete");
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  }

  function exportFailedRows() {
    if (!result?.failedRows.length) return;
    const csv = failedImportRowsToBulkCsv(result.failedRows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = VIBEMUSIC_BULK_FAILED_ROWS_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onSheetDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setSheetDragActive(false);
    assignSheet(event.dataTransfer.files?.[0] ?? null);
  }

  function onZipDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setZipDragActive(false);
    assignZip(event.dataTransfer.files?.[0] ?? null);
  }

  const confirmDescription = [
    summary
      ? `${summary.creates} create${summary.creates === 1 ? "" : "s"}, ${summary.updates} update${summary.updates === 1 ? "" : "s"}, ${summary.skips} skip${summary.skips === 1 ? "" : "s"}.`
      : `${importableCount} row${importableCount === 1 ? "" : "s"} ready.`,
    `Products publish as ${options.publishStatus}.`,
    zipFile ? "Images from the ZIP will upload during import." : null,
  ]
    .filter(Boolean)
    .join(" ");

  const stepIndex = STEPS.findIndex(
    (item) => item.id === (step === "importing" ? "preview" : step),
  );

  return (
    <>
      <div
        ref={dialogRef as RefObject<HTMLDivElement>}
        className="admin-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-import-title"
      >
        <div className="admin-panel bulk-import-modal" onClick={(event) => event.stopPropagation()}>
          <div
            className="admin-panel__header"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div>
              <h2 id="bulk-import-title">{VIBEMUSIC_BULK_IMPORT_TITLE}</h2>
              <p className="bulk-import-help" style={{ marginTop: "0.35rem" }}>
                Upload products using the official <strong>vibemusic bulk</strong> spreadsheet —{" "}
                <strong>up to {MAX_IMPORT_ROWS.toLocaleString()} products per upload</strong>,{" "}
                {VIBEMUSIC_BULK_COLUMN_COUNT} columns in exact order (
                {VIBEMUSIC_BULK_REQUIRED_COLUMNS}).
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={loading}
              onClick={handleClose}
            >
              Close
            </button>
          </div>

          <div className="admin-panel__body">
            <ol className="bulk-import-stepper" aria-label="Import progress">
              {STEPS.map((item, index) => {
                const done = index < stepIndex || step === "complete";
                const active = index === stepIndex && step !== "complete";
                return (
                  <li
                    key={item.id}
                    className={`bulk-import-stepper__item${active ? " bulk-import-stepper__item--active" : ""}${done ? " bulk-import-stepper__item--done" : ""}`}
                  >
                    <span className="bulk-import-stepper__index">{index + 1}</span>
                    {item.label}
                  </li>
                );
              })}
            </ol>

            {error ? (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            ) : null}

            {step === "upload" ? (
              <>
                <p className="bulk-import-help" style={{ marginBottom: "1rem" }}>
                  Use <strong>vibemusic bulk.csv</strong> or <strong>vibemusic bulk.xlsx</strong>{" "}
                  without changing the header row. Fill one product per row, then upload here.
                  Optionally attach a SKU-named images ZIP.
                </p>
                <p
                  style={{
                    marginBottom: "1rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <a
                    href={VIBEMUSIC_BULK_TEMPLATE_XLSX_URL}
                    download={VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE}
                    className="admin-link"
                  >
                    Download {VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE}
                  </a>
                  <a
                    href={VIBEMUSIC_BULK_TEMPLATE_CSV_URL}
                    download={VIBEMUSIC_BULK_TEMPLATE_CSV_FILE}
                    className="admin-link"
                  >
                    Download {VIBEMUSIC_BULK_TEMPLATE_CSV_FILE}
                  </a>
                </p>

                <div className="bulk-import-grid">
                  <div
                    className={`bulk-import-dropzone${sheetFile ? " bulk-import-dropzone--ready" : ""}${sheetDragActive ? " bulk-import-dropzone--drag" : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setSheetDragActive(true);
                    }}
                    onDragLeave={() => setSheetDragActive(false)}
                    onDrop={onSheetDrop}
                  >
                    <p className="bulk-import-dropzone__title">
                      Listing file — vibemusic bulk (required)
                    </p>
                    <p className="bulk-import-dropzone__hint">
                      Drag & drop .xlsx / .csv here, or browse. Max {MAX_SHEET_MB} MB · up to{" "}
                      {MAX_IMPORT_ROWS.toLocaleString()} product rows per file.
                    </p>
                    <input
                      ref={sheetRef}
                      id="bulk-import-sheet"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      hidden
                      onChange={(event) => assignSheet(event.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => sheetRef.current?.click()}
                    >
                      Browse listing file
                    </button>
                    {sheetFile ? (
                      <div className="bulk-import-dropzone__file">
                        <span>
                          {sheetFile.name} · {formatBytes(sheetFile.size)}
                        </span>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() => assignSheet(null)}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div
                    className={`bulk-import-dropzone${zipFile ? " bulk-import-dropzone--ready" : ""}${zipDragActive ? " bulk-import-dropzone--drag" : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setZipDragActive(true);
                    }}
                    onDragLeave={() => setZipDragActive(false)}
                    onDrop={onZipDrop}
                  >
                    <p className="bulk-import-dropzone__title">Images ZIP (optional)</p>
                    <p className="bulk-import-dropzone__hint">
                      Name files by SKU (<code>SKU.jpg</code>, <code>SKU_1.jpg</code>). Max{" "}
                      {MAX_ZIP_MB} MB.
                    </p>
                    <input
                      ref={zipRef}
                      id="bulk-import-zip"
                      type="file"
                      accept=".zip,application/zip"
                      hidden
                      onChange={(event) => assignZip(event.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => zipRef.current?.click()}
                    >
                      Browse images ZIP
                    </button>
                    {zipFile ? (
                      <div className="bulk-import-dropzone__file">
                        <span>
                          {zipFile.name} · {formatBytes(zipFile.size)}
                        </span>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() => assignZip(null)}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            {step === "options" ? (
              <div className="bulk-import-options">
                <div className="bulk-import-option-card">
                  <p className="bulk-import-option-card__title">Duplicate SKU strategy</p>
                  <label>
                    <input
                      type="radio"
                      name="duplicateStrategy"
                      checked={options.duplicateStrategy === "fail"}
                      onChange={() =>
                        setOptions((prev) => ({ ...prev, duplicateStrategy: "fail" }))
                      }
                    />
                    <span>
                      <strong>Reject duplicates</strong> — fail rows when SKU already exists (safest
                      for new catalog uploads).
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="duplicateStrategy"
                      checked={options.duplicateStrategy === "skip"}
                      onChange={() =>
                        setOptions((prev) => ({ ...prev, duplicateStrategy: "skip" }))
                      }
                    />
                    <span>
                      <strong>Skip existing</strong> — leave current catalog products untouched.
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="duplicateStrategy"
                      checked={options.duplicateStrategy === "update"}
                      onChange={() =>
                        setOptions((prev) => ({ ...prev, duplicateStrategy: "update" }))
                      }
                    />
                    <span>
                      <strong>Update existing</strong> — refresh price, copy, specs, and images for
                      matching SKUs.
                    </span>
                  </label>
                </div>

                <div className="bulk-import-option-card">
                  <p className="bulk-import-option-card__title">Publish status</p>
                  <label>
                    <input
                      type="radio"
                      name="publishStatus"
                      checked={options.publishStatus === "active"}
                      onChange={() => setOptions((prev) => ({ ...prev, publishStatus: "active" }))}
                    />
                    <span>
                      <strong>Active</strong> — visible on storefront immediately after import.
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="publishStatus"
                      checked={options.publishStatus === "draft"}
                      onChange={() => setOptions((prev) => ({ ...prev, publishStatus: "draft" }))}
                    />
                    <span>
                      <strong>Draft</strong> — import now, review in admin before going live.
                    </span>
                  </label>
                  <p className="bulk-import-help" style={{ marginTop: "0.75rem" }}>
                    Products import with stock <strong>0</strong> unless your vibemusic bulk sheet
                    includes stock values.
                  </p>
                </div>
              </div>
            ) : null}

            {step === "importing" ? (
              <div className="bulk-import-progress" aria-live="polite">
                <strong>Import in progress</strong>
                <p className="bulk-import-help" style={{ marginTop: "0.5rem" }}>
                  Writing up to {MAX_IMPORT_ROWS.toLocaleString()} products in batches. Large
                  imports can take several minutes — keep this window open until completion.
                </p>
                <div className="bulk-import-progress__bar" aria-hidden="true">
                  <span />
                </div>
              </div>
            ) : null}

            {step === "preview" && summary ? (
              <>
                <div className="bulk-import-stats">
                  <div className="bulk-import-stat bulk-import-stat--success">
                    <span className="bulk-import-stat__value">{summary.creates}</span>
                    <span className="bulk-import-stat__label">Creates</span>
                  </div>
                  <div className="bulk-import-stat bulk-import-stat--info">
                    <span className="bulk-import-stat__value">{summary.updates}</span>
                    <span className="bulk-import-stat__label">Updates</span>
                  </div>
                  <div className="bulk-import-stat bulk-import-stat--warning">
                    <span className="bulk-import-stat__value">{summary.skips}</span>
                    <span className="bulk-import-stat__label">Skips</span>
                  </div>
                  <div className="bulk-import-stat bulk-import-stat--danger">
                    <span className="bulk-import-stat__value">{summary.invalid}</span>
                    <span className="bulk-import-stat__label">Errors</span>
                  </div>
                  <div className="bulk-import-stat">
                    <span className="bulk-import-stat__value">{summary.withImages}</span>
                    <span className="bulk-import-stat__label">With images</span>
                  </div>
                </div>

                {summary.errorBreakdown.length > 0 ? (
                  <ul className="bulk-import-error-list">
                    {summary.errorBreakdown.map((item) => (
                      <li key={item.message}>
                        {item.count}× {item.message}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="bulk-import-toolbar">
                  <div
                    className="bulk-import-filter-tabs"
                    role="group"
                    aria-label="Filter preview rows"
                  >
                    {(
                      [
                        ["all", "All"],
                        ["valid", "Valid"],
                        ["errors", "Errors"],
                        ["updates", "Updates"],
                        ["skips", "Skips"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={filter === id}
                        onClick={() => setFilter(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="admin-input bulk-import-search"
                    placeholder="Search SKU, title, brand, category…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search preview rows"
                  />
                </div>

                <div className="bulk-import-table-wrap">
                  {previewTableTruncated ? (
                    <p className="bulk-import-help" style={{ marginBottom: "0.75rem" }}>
                      Showing first {BULK_IMPORT_PREVIEW_TABLE_LIMIT.toLocaleString()} of{" "}
                      {filteredPreview.length.toLocaleString()} filtered rows. Use search or filters
                      to narrow results.
                    </p>
                  ) : null}
                  <table className="admin-table" aria-label="Import preview">
                    <caption className="sr-only">Bulk import preview rows</caption>
                    <thead>
                      <tr>
                        <th scope="col">Row</th>
                        <th scope="col">Action</th>
                        <th scope="col">Item title</th>
                        <th scope="col">SKU</th>
                        <th scope="col">Category</th>
                        <th scope="col">Price</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePreview.map((row) => (
                        <tr key={row.rowNumber}>
                          <td>{row.rowNumber}</td>
                          <td>
                            <span className={rowActionClass(row)}>{rowActionLabel(row)}</span>
                          </td>
                          <td>{row.name}</td>
                          <td>{row.sku || row.generatedSku}</td>
                          <td>{row.category}</td>
                          <td>{row.price}</td>
                          <td>
                            {row.valid ? (
                              <span style={{ color: "var(--admin-success)" }}>
                                {row.warnings?.[0] ?? "Ready"}
                              </span>
                            ) : (
                              <span style={{ color: "var(--admin-danger)" }}>
                                {row.errors.join("; ")}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {step === "complete" && result ? (
              <div aria-live="polite">
                <p>
                  <strong>Import complete</strong>
                </p>
                <div className="bulk-import-results-grid">
                  <div className="bulk-import-stat bulk-import-stat--success">
                    <span className="bulk-import-stat__value">{result.imported}</span>
                    <span className="bulk-import-stat__label">Created</span>
                  </div>
                  <div className="bulk-import-stat bulk-import-stat--info">
                    <span className="bulk-import-stat__value">{result.updated}</span>
                    <span className="bulk-import-stat__label">Updated</span>
                  </div>
                  <div className="bulk-import-stat bulk-import-stat--warning">
                    <span className="bulk-import-stat__value">{result.skipped}</span>
                    <span className="bulk-import-stat__label">Skipped</span>
                  </div>
                  <div className="bulk-import-stat bulk-import-stat--danger">
                    <span className="bulk-import-stat__value">{result.errors}</span>
                    <span className="bulk-import-stat__label">Write errors</span>
                  </div>
                </div>
                {result.failedRows.length > 0 ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    onClick={exportFailedRows}
                  >
                    Download failed rows (vibemusic bulk template)
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="bulk-import-footer">
              <p className="bulk-import-help">
                {step === "upload" && "Step 1 of 4 — attach your listing file."}
                {step === "options" && "Step 2 of 4 — choose duplicate and publish behavior."}
                {step === "preview" && "Step 3 of 4 — review analytics, then confirm import."}
                {step === "importing" && "Writing to catalog…"}
                {step === "complete" && "Done — you can import another file or close this dialog."}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {step === "upload" ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={!sheetFile}
                    onClick={() => setStep("options")}
                  >
                    Continue to options
                  </button>
                ) : null}
                {step === "options" ? (
                  <>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => setStep("upload")}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={loading}
                      onClick={() => void runPreview()}
                    >
                      {loading ? "Analyzing file…" : "Run validation preview"}
                    </button>
                  </>
                ) : null}
                {step === "preview" ? (
                  <>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      disabled={loading}
                      onClick={() => setStep("options")}
                    >
                      Back to options
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={loading || importableCount === 0}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Confirm import ({importableCount})
                    </button>
                  </>
                ) : null}
                {step === "complete" ? (
                  <>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={reset}
                    >
                      Import another file
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={handleClose}
                    >
                      Done
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmOpen}
        title={`Run import for ${importableCount} row${importableCount === 1 ? "" : "s"}?`}
        description={confirmDescription}
        confirmLabel="Import now"
        loading={loading}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
