"use client";

import { useState, useRef, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Tag,
  Layers,
  Globe,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import type { CatalogTaxonomyItem, TaxonomyStats, TaxonomyImportResult } from "@/types/taxonomy";

function TaxonomyContent({ canWrite }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<TaxonomyImportResult | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [isSyncing, startSyncTransition] = useTransition();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Fetch Taxonomy Data + Stats + Filter Options
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-taxonomy", page, limit, search, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        stats: "true",
        filters: "true",
      });
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);

      const res = await fetch(`/api/admin/taxonomy?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load taxonomy data");
      return res.json() as Promise<{
        items: CatalogTaxonomyItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
        stats?: TaxonomyStats;
        filterOptions?: { categories: string[]; subcategories: string[] };
      }>;
    },
  });

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  // Upload Mutation
  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError("Please select a .xlsx or .csv catalog file.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (replaceExisting) {
        formData.append("replace", "true");
      }

      const res = await fetch("/api/admin/taxonomy/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to import catalog");
      }

      setImportResult(json.result);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["admin-taxonomy"] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Category Sync
  const handleSyncCategories = () => {
    setSyncFeedback(null);
    startSyncTransition(async () => {
      try {
        const res = await fetch("/api/admin/taxonomy/sync", { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Sync failed");
        setSyncFeedback(
          `Sync complete: ${json.result.created} new categories created, ${json.result.existing} already matched.`,
        );
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      } catch (err) {
        setSyncFeedback(err instanceof Error ? err.message : "Sync error");
      }
    });
  };

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load catalog taxonomy."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 };
  const stats = data?.stats ?? {
    totalNodes: 0,
    distinctCategories: 0,
    distinctSubcategories: 0,
    distinctProductTypes: 0,
    distinctGoogleCategories: 0,
  };
  const categoryOptions = data?.filterOptions?.categories ?? [];

  return (
    <>
      {/* Top Action Toolbar */}
      <div
        className="admin-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {canWrite && (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => setShowUploadPanel(!showUploadPanel)}
            >
              <UploadCloud size={16} />
              {showUploadPanel ? "Hide Uploader" : "Upload Catalog (.xlsx)"}
            </button>
          )}

          <a
            href="/api/admin/taxonomy/export"
            className="admin-btn admin-btn--secondary"
            download
            style={{ textDecoration: "none" }}
          >
            <Download size={16} />
            Export CSV
          </a>

          {canWrite && stats.totalNodes > 0 && (
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={handleSyncCategories}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 size={16} className="admin-spinner" />
              ) : (
                <RefreshCw size={16} />
              )}
              Sync Categories
            </button>
          )}
        </div>
      </div>

      {syncFeedback && (
        <div
          className="admin-panel"
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: "rgba(34, 197, 94, 0.1)",
            borderColor: "rgba(34, 197, 94, 0.3)",
            color: "#22c55e",
            borderRadius: "var(--admin-radius-sm)",
          }}
        >
          {syncFeedback}
        </div>
      )}

      {/* Upload Master Catalog Panel */}
      {showUploadPanel && canWrite && (
        <div className="admin-panel" style={{ marginBottom: "1.5rem" }}>
          <div className="admin-panel__header">
            <h2
              className="admin-panel__title"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FileSpreadsheet size={18} />
              Upload Catalog Master Spreadsheet (.xlsx / .csv)
            </h2>
          </div>
          <div className="admin-panel__body">
            <p style={{ color: "var(--admin-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Upload your master catalog sheet (e.g. <code>Vibe_Music_Catalog_Master.xlsx</code>).
              The engine automatically maps the 10 taxonomy columns (*Category, Subcategory,
              Variant, Product Type, Instrument Family, SEO Slug, Google Product Category, Menu
              Levels 1–3*), and cleans duplicate rows before saving.
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "600px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setUploadFile(f);
                    setUploadError(null);
                  }}
                  className="admin-input"
                  style={{ flex: 1, padding: "0.5rem" }}
                  disabled={isUploading}
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  disabled={isUploading}
                />
                <span>Replace all existing taxonomy records (fresh import)</span>
              </label>

              {uploadError && (
                <div
                  style={{
                    color: "var(--admin-danger)",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <AlertCircle size={15} />
                  {uploadError}
                </div>
              )}

              {importResult && (
                <div
                  style={{
                    padding: "0.875rem 1rem",
                    borderRadius: "var(--admin-radius-sm)",
                    background: "rgba(34, 197, 94, 0.12)",
                    border: "1px solid rgba(34, 197, 94, 0.25)",
                    fontSize: "0.875rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: 600,
                      color: "#22c55e",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Import Successful!
                  </div>
                  <div>
                    <strong>Total rows read:</strong> {importResult.totalRowsRead.toLocaleString()}
                  </div>
                  <div>
                    <strong>Unique taxonomy entries saved:</strong>{" "}
                    {importResult.uniqueRowsImported.toLocaleString()}
                  </div>
                  <div>
                    <strong>Duplicates cleaned:</strong>{" "}
                    {importResult.duplicatesSkipped.toLocaleString()}
                  </div>
                  <div
                    style={{
                      color: "var(--admin-muted)",
                      fontSize: "0.75rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    Completed in {importResult.durationMs}ms
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="admin-spinner" />
                      Parsing & Importing…
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      Start Upload
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => {
                    setShowUploadPanel(false);
                    setUploadError(null);
                  }}
                  disabled={isUploading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Counters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="admin-panel" style={{ padding: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>Total Nodes</span>
            <Layers size={18} style={{ color: "var(--brand-primary, #1253ed)" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {stats.totalNodes.toLocaleString()}
          </div>
        </div>

        <div className="admin-panel" style={{ padding: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>Categories</span>
            <FolderTree size={18} style={{ color: "#10b981" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {stats.distinctCategories.toLocaleString()}
          </div>
        </div>

        <div className="admin-panel" style={{ padding: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>Subcategories</span>
            <Tag size={18} style={{ color: "#f59e0b" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {stats.distinctSubcategories.toLocaleString()}
          </div>
        </div>

        <div className="admin-panel" style={{ padding: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>
              Google Taxonomy
            </span>
            <Globe size={18} style={{ color: "#a855f7" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            {stats.distinctGoogleCategories.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="admin-panel"
        style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: "flex", gap: "0.5rem", flex: "1 1 300px" }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--admin-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search by slug, type, variant, or category…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="admin-input"
              style={{ width: "100%", paddingLeft: "2.25rem" }}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn--secondary">
            Search
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter size={15} style={{ color: "var(--admin-muted)" }} />
          <select
            className="admin-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Product Type</th>
                <th>Variant</th>
                <th>SEO Slug</th>
                <th>Google Product Category</th>
                <th>Menu Path</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                    <EmptyState
                      message={
                        stats.totalNodes === 0
                          ? "No catalog taxonomy loaded yet. Click 'Upload Catalog' above to import Vibe_Music_Catalog_Master.xlsx."
                          : "No taxonomy records matched your search."
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="admin-badge admin-badge--neutral">{item.category}</span>
                    </td>
                    <td>
                      <strong>{item.subcategory}</strong>
                    </td>
                    <td>{item.productType}</td>
                    <td>
                      {item.variant ? (
                        <span style={{ color: "var(--admin-text)" }}>{item.variant}</span>
                      ) : (
                        <span style={{ color: "var(--admin-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: "0.75rem",
                          background: "var(--admin-surface-2)",
                          padding: "0.2rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        {item.seoSlug}
                      </code>
                    </td>
                    <td
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--admin-muted)",
                        maxWidth: "220px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.googleProductCategory || ""}
                    >
                      {item.googleProductCategory || "—"}
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>
                      {[item.menuLevel1, item.menuLevel2, item.menuLevel3]
                        .filter(Boolean)
                        .join(" > ") || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.875rem 1.25rem",
              borderTop: "1px solid var(--admin-border)",
              fontSize: "0.875rem",
              color: "var(--admin-muted)",
            }}
          >
            <div>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of{" "}
              {pagination.total.toLocaleString()} records
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ padding: "0.35rem 0.6rem" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ padding: "0.35rem 0.6rem" }}
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminTaxonomyPage() {
  return (
    <AdminGuard>
      {(admin) => {
        const canWrite = admin.permissions.includes("categories:write");
        const canDelete = admin.permissions.includes("categories:delete");
        return (
          <AdminShell admin={admin} title="Master Catalog Taxonomy">
            <TaxonomyContent canWrite={canWrite} canDelete={canDelete} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
