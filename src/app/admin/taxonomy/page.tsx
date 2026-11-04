"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
  Plus,
  Pencil,
  Trash2,
  Info,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import { LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import type { CatalogTaxonomyItem, TaxonomyStats, TaxonomyImportResult } from "@/types/taxonomy";

interface NodeFormData {
  category: string;
  subcategory: string;
  productType: string;
  variant: string;
  instrumentFamily: string;
  seoSlug: string;
  googleProductCategory: string;
  menuLevel1: string;
  menuLevel2: string;
  menuLevel3: string;
  isArchived: boolean;
}

const EMPTY_NODE_FORM: NodeFormData = {
  category: "",
  subcategory: "",
  productType: "",
  variant: "",
  instrumentFamily: "",
  seoSlug: "",
  googleProductCategory: "",
  menuLevel1: "",
  menuLevel2: "",
  menuLevel3: "",
  isArchived: false,
};

function generateSlug(cat: string, sub: string, type: string, variant?: string): string {
  return [cat, sub, type, variant]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function TaxonomyContent({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{
    open: boolean;
    type: "selected" | "all";
    count: number;
  }>({ open: false, type: "selected", count: 0 });
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<TaxonomyImportResult | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [isSyncing, startSyncTransition] = useTransition();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Node Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeForm, setNodeForm] = useState<NodeFormData>(EMPTY_NODE_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch Taxonomy Data + Stats + Filter Options
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-taxonomy", page, limit, search, selectedCategory],
    placeholderData: keepPreviousData,
    staleTime: 5_000,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        stats: "true",
        filters: "true",
      });
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);

      return adminFetchJson<{
        items: CatalogTaxonomyItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
        stats?: TaxonomyStats;
        filterOptions?: { categories: string[]; subcategories: string[] };
      }>(`/api/admin/taxonomy?${params.toString()}`);
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

      const json = await adminMutateJson<{
        result: TaxonomyImportResult;
        categorySync: { created: number; existing: number };
      }>("/api/admin/taxonomy/import", {
        method: "POST",
        body: formData,
      });

      setImportResult(json.result);
      setSyncFeedback(
        `Category hierarchy synced: ${json.categorySync.created} new categories/subcategories created; ${json.categorySync.existing} already matched.`,
      );
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["admin-taxonomy"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
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
        const json = await adminMutateJson<{ result: { created: number; existing: number } }>(
          "/api/admin/taxonomy/sync",
          { method: "POST" },
        );
        setSyncFeedback(
          `Sync complete: ${json.result.created} new categories created, ${json.result.existing} already matched.`,
        );
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      } catch (err) {
        setSyncFeedback(err instanceof Error ? err.message : "Sync error");
      }
    });
  };

  const handleBackfillSubcategories = () => {
    setSyncFeedback(null);
    startSyncTransition(async () => {
      try {
        const json = await adminMutateJson<{
          updated: number;
          missing: number;
          unresolved?: Array<{ name: string }>;
        }>("/api/admin/products/backfill-subcategories", { method: "POST" });
        const unresolved = (json.unresolved ?? []) as Array<{ name: string }>;
        setSyncFeedback(
          `Subcategories: ${json.updated} of ${json.missing} products missing one were filled.` +
            (unresolved.length
              ? ` Still missing (set Product Type or Subcategory in admin): ${unresolved
                  .slice(0, 5)
                  .map((item) => item.name)
                  .join(", ")}${unresolved.length > 5 ? `, +${unresolved.length - 5} more` : ""}.`
              : ""),
        );
      } catch (err) {
        setSyncFeedback(err instanceof Error ? err.message : "Subcategory backfill error");
      }
    });
  };

  // Save Node (Create or Update)
  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      const payload = {
        category: nodeForm.category.trim(),
        subcategory: nodeForm.subcategory.trim(),
        productType: nodeForm.productType.trim(),
        variant: nodeForm.variant.trim() || null,
        instrumentFamily: nodeForm.instrumentFamily.trim() || null,
        seoSlug:
          nodeForm.seoSlug.trim() ||
          generateSlug(
            nodeForm.category,
            nodeForm.subcategory,
            nodeForm.productType,
            nodeForm.variant,
          ),
        googleProductCategory: nodeForm.googleProductCategory.trim() || null,
        menuLevel1: nodeForm.menuLevel1.trim() || null,
        menuLevel2: nodeForm.menuLevel2.trim() || null,
        menuLevel3: nodeForm.menuLevel3.trim() || null,
        isArchived: nodeForm.isArchived,
      };

      if (editingNodeId) {
        await adminMutateJson(`/api/admin/taxonomy/${editingNodeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await adminMutateJson("/api/admin/taxonomy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      setEditingNodeId(null);
      setNodeForm(EMPTY_NODE_FORM);
      queryClient.invalidateQueries({ queryKey: ["admin-taxonomy"] });
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to save taxonomy node");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Node (Single)
  const handleDeleteNode = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}" from Master Taxonomy?\n\nStorefront categories, products, and header menus will NOT be deleted.`,
      )
    ) {
      return;
    }
    try {
      await adminMutateJson(`/api/admin/taxonomy/${id}`, {
        method: "DELETE",
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-taxonomy"], refetchType: "all" });
      if (items.length <= 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete node");
    }
  };

  // Bulk Delete (Selected or All)
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      if (bulkDeleteDialog.type === "all") {
        await adminMutateJson("/api/admin/taxonomy", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            all: true,
          }),
        });
        setPage(1);
      } else {
        const ids = Array.from(selectedIds);
        await adminMutateJson("/api/admin/taxonomy", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids,
          }),
        });
        if (selectedIds.size >= items.length && page > 1) {
          setPage((p) => Math.max(1, p - 1));
        }
      }

      setSelectedIds(new Set());
      setSelectAllAcrossPages(false);
      setBulkDeleteDialog({ open: false, type: "selected", count: 0 });
      await queryClient.invalidateQueries({ queryKey: ["admin-taxonomy"], refetchType: "all" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk delete failed");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingNodeId(null);
    setNodeForm(EMPTY_NODE_FORM);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CatalogTaxonomyItem) => {
    setEditingNodeId(item.id);
    setNodeForm({
      category: item.category,
      subcategory: item.subcategory,
      productType: item.productType,
      variant: item.variant || "",
      instrumentFamily: item.instrumentFamily || "",
      seoSlug: item.seoSlug,
      googleProductCategory: item.googleProductCategory || "",
      menuLevel1: item.menuLevel1 || "",
      menuLevel2: item.menuLevel2 || "",
      menuLevel3: item.menuLevel3 || "",
      isArchived: Boolean(item.isArchived),
    });
    setModalError(null);
    setIsModalOpen(true);
  };

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

  const isAllOnPageSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const isSomeOnPageSelected = items.some((i) => selectedIds.has(i.id)) && !isAllOnPageSelected;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeOnPageSelected && !selectAllAcrossPages;
    }
  }, [isSomeOnPageSelected, selectAllAcrossPages]);

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load catalog taxonomy."}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectAllAcrossPages(false);
  };

  const toggleSelectAllOnPage = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
      setSelectAllAcrossPages(false);
    }
  };

  return (
    <>
      {/* Functional Separation Banner */}
      <div
        className="admin-panel"
        style={{
          marginBottom: "1.25rem",
          padding: "1rem 1.25rem",
          background: "rgba(59, 130, 246, 0.08)",
          borderColor: "rgba(59, 130, 246, 0.25)",
          borderRadius: "var(--admin-radius-sm)",
          display: "flex",
          gap: "1rem",
          alignItems: "flex-start",
        }}
      >
        <FolderTree size={22} style={{ color: "#3b82f6", marginTop: "2px", flexShrink: 0 }} />
        <div style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>
          <strong style={{ color: "#60a5fa" }}>Master Taxonomy Architecture:</strong> Centralized
          product classification structure for Google Merchant mapping, catalog imports, variants,
          and SEO.
          <ul style={{ margin: "0.35rem 0 0 1.25rem", padding: 0, color: "var(--admin-muted)" }}>
            <li>
              <strong>Independent:</strong> Adding, editing, archiving, or deleting taxonomy nodes
              does not modify or delete storefront categories, header menus, or homepage sections.
            </li>
            <li>
              <strong>Menu Level 1, 2, 3:</strong> Classification and reference fields only — they
              do not directly dictate the live storefront header navigation (manage navigation at{" "}
              <a href="/admin/navigation" style={{ color: "#3b82f6", textDecoration: "underline" }}>
                Header & Menu Management
              </a>
              ).
            </li>
          </ul>
        </div>
      </div>

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
            <button type="button" className="admin-btn admin-btn--primary" onClick={openAddModal}>
              <Plus size={16} />
              Add Node
            </button>
          )}

          {canWrite && (
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
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

          {canWrite && (
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={handleBackfillSubcategories}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader2 size={16} className="admin-spinner" /> : <Tag size={16} />}
              Fill Missing Product Subcategories
            </button>
          )}

          {canDelete && stats.totalNodes > 0 && (
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={() =>
                setBulkDeleteDialog({
                  open: true,
                  type: "all",
                  count: stats.totalNodes,
                })
              }
              title="Delete all master taxonomy records"
            >
              <Trash2 size={16} />
              Purge All ({stats.totalNodes.toLocaleString()})
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

      {/* Selection Action Toolbar */}
      {(selectedIds.size > 0 || selectAllAcrossPages) && (
        <div
          className="admin-panel"
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: "rgba(239, 68, 68, 0.08)",
            borderColor: "rgba(239, 68, 68, 0.25)",
            borderRadius: "var(--admin-radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {selectAllAcrossPages
                ? `All ${pagination.total.toLocaleString()} taxonomy records selected`
                : `${selectedIds.size} record${selectedIds.size === 1 ? "" : "s"} selected on this page`}
            </span>
            {isAllOnPageSelected && pagination.total > items.length && !selectAllAcrossPages && (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                onClick={() => setSelectAllAcrossPages(true)}
              >
                Select all {pagination.total.toLocaleString()} records across all pages
              </button>
            )}
            {selectAllAcrossPages && (
              <span
                className="admin-badge"
                style={{
                  background: "rgba(59, 130, 246, 0.2)",
                  color: "#60a5fa",
                  fontSize: "0.75rem",
                }}
              >
                All Pages Selected
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {canDelete && (
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                style={{ padding: "0.4rem 0.85rem" }}
                onClick={() =>
                  setBulkDeleteDialog({
                    open: true,
                    type: selectAllAcrossPages ? "all" : "selected",
                    count: selectAllAcrossPages ? pagination.total : selectedIds.size,
                  })
                }
              >
                <Trash2 size={15} />
                Delete{" "}
                {selectAllAcrossPages
                  ? `All (${pagination.total.toLocaleString()})`
                  : `Selected (${selectedIds.size})`}
              </button>
            )}
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              style={{ padding: "0.4rem 0.75rem" }}
              onClick={() => {
                setSelectedIds(new Set());
                setSelectAllAcrossPages(false);
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="admin-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center" }}>
                  <input
                    ref={masterCheckboxRef}
                    type="checkbox"
                    checked={(isAllOnPageSelected && items.length > 0) || selectAllAcrossPages}
                    onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                    aria-label="Select all on this page"
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                </th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Product Type</th>
                <th>Variant</th>
                <th>SEO Slug</th>
                <th>Google Product Category</th>
                <th>Menu Path</th>
                <th>Status</th>
                {(canWrite || canDelete) && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                    <EmptyState
                      message={
                        stats.totalNodes === 0
                          ? "No catalog taxonomy loaded yet. Click 'Upload Catalog' or 'Add Node' above."
                          : "No taxonomy records matched your search."
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id) || selectAllAcrossPages}
                        onChange={() => toggleSelectRow(item.id)}
                        aria-label={`Select ${item.category} ${item.subcategory} ${item.productType}`}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                    </td>
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
                        maxWidth: "180px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.googleProductCategory || ""}
                    >
                      {item.googleProductCategory || "—"}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--admin-muted)" }}>
                      {[item.menuLevel1, item.menuLevel2, item.menuLevel3]
                        .filter(Boolean)
                        .join(" > ") || "—"}
                    </td>
                    <td>
                      {item.isArchived ? (
                        <span
                          className="admin-badge"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          Archived
                        </span>
                      ) : (
                        <span
                          className="admin-badge"
                          style={{
                            background: "rgba(34, 197, 94, 0.15)",
                            color: "#22c55e",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                          }}
                        >
                          Active
                        </span>
                      )}
                    </td>
                    {(canWrite || canDelete) && (
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          {canWrite && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              style={{ padding: "0.3rem 0.5rem" }}
                              onClick={() => openEditModal(item)}
                              title="Edit Node"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              style={{ padding: "0.3rem 0.5rem" }}
                              onClick={() =>
                                handleDeleteNode(
                                  item.id,
                                  `${item.category} > ${item.subcategory} > ${item.productType}`,
                                )
                              }
                              title="Delete Node"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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

      {/* Add / Edit Taxonomy Node Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div
            className="admin-modal"
            style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {editingNodeId ? "Edit Master Taxonomy Node" : "Add Master Taxonomy Node"}
              </h3>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ padding: "0.2rem 0.5rem" }}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNode}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div className="admin-form-group">
                  <label>Category *</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={nodeForm.category}
                    onChange={(e) => setNodeForm({ ...nodeForm, category: e.target.value })}
                    placeholder="e.g. Guitars"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Subcategory *</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={nodeForm.subcategory}
                    onChange={(e) => setNodeForm({ ...nodeForm, subcategory: e.target.value })}
                    placeholder="e.g. Electric Guitars"
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div className="admin-form-group">
                  <label>Product Type *</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={nodeForm.productType}
                    onChange={(e) => setNodeForm({ ...nodeForm, productType: e.target.value })}
                    placeholder="e.g. Solid Body"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Variant (Optional)</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={nodeForm.variant}
                    onChange={(e) => setNodeForm({ ...nodeForm, variant: e.target.value })}
                    placeholder="e.g. 6-String"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div className="admin-form-group">
                  <label>Instrument Family (Optional)</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={nodeForm.instrumentFamily}
                    onChange={(e) => setNodeForm({ ...nodeForm, instrumentFamily: e.target.value })}
                    placeholder="e.g. Stringed Instruments"
                  />
                </div>
                <div className="admin-form-group">
                  <label>SEO Slug *</label>
                  <input
                    className="admin-input"
                    type="text"
                    value={nodeForm.seoSlug}
                    onChange={(e) => setNodeForm({ ...nodeForm, seoSlug: e.target.value })}
                    placeholder="e.g. guitars-electric-guitars-solid-body"
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group" style={{ marginBottom: "0.75rem" }}>
                <label>Google Product Category (Optional)</label>
                <input
                  className="admin-input"
                  type="text"
                  value={nodeForm.googleProductCategory}
                  onChange={(e) =>
                    setNodeForm({ ...nodeForm, googleProductCategory: e.target.value })
                  }
                  placeholder="e.g. Sporting Goods > Musical Instruments > Guitars"
                />
              </div>

              <div
                style={{
                  padding: "0.85rem",
                  background: "var(--admin-surface-2)",
                  borderRadius: "var(--admin-radius-sm)",
                  marginBottom: "0.75rem",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--admin-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Info size={13} />
                  Classification Reference Path (Non-Navigation Reference)
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                      Menu Level 1
                    </label>
                    <input
                      className="admin-input"
                      type="text"
                      value={nodeForm.menuLevel1}
                      onChange={(e) => setNodeForm({ ...nodeForm, menuLevel1: e.target.value })}
                      placeholder="Level 1"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                      Menu Level 2
                    </label>
                    <input
                      className="admin-input"
                      type="text"
                      value={nodeForm.menuLevel2}
                      onChange={(e) => setNodeForm({ ...nodeForm, menuLevel2: e.target.value })}
                      placeholder="Level 2"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                      Menu Level 3
                    </label>
                    <input
                      className="admin-input"
                      type="text"
                      value={nodeForm.menuLevel3}
                      onChange={(e) => setNodeForm({ ...nodeForm, menuLevel3: e.target.value })}
                      placeholder="Level 3"
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={nodeForm.isArchived}
                    onChange={(e) => setNodeForm({ ...nodeForm, isArchived: e.target.checked })}
                  />
                  <span>Archive this node (hide from catalog classification suggestions)</span>
                </label>
              </div>

              {modalError && (
                <div
                  style={{
                    color: "var(--admin-danger)",
                    fontSize: "0.875rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {modalError}
                </div>
              )}

              <div
                className="admin-modal-actions"
                style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}
              >
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingNodeId ? "Save Changes" : "Create Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Delete Confirm Dialog */}
      <AdminConfirmDialog
        open={bulkDeleteDialog.open}
        title={
          bulkDeleteDialog.type === "all"
            ? "Purge All Master Taxonomy?"
            : `Delete ${bulkDeleteDialog.count} Selected Taxonomy Records?`
        }
        description={
          bulkDeleteDialog.type === "all"
            ? `Are you sure you want to permanently delete all ${bulkDeleteDialog.count.toLocaleString()} taxonomy records? This action cannot be undone.\n\nStorefront categories, products, and header menus will NOT be deleted.`
            : `Are you sure you want to delete ${bulkDeleteDialog.count} selected taxonomy record(s)? This action cannot be undone.\n\nStorefront categories, products, and header menus will NOT be deleted.`
        }
        confirmLabel={
          isBulkDeleting
            ? "Deleting…"
            : bulkDeleteDialog.type === "all"
              ? "Purge All Records"
              : "Delete Selected"
        }
        variant="danger"
        loading={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => {
          if (!isBulkDeleting) setBulkDeleteDialog({ open: false, type: "selected", count: 0 });
        }}
      />
    </>
  );
}

export default function AdminTaxonomyPage() {
  return (
    <AdminGuard>
      {(admin) => {
        const canWrite =
          admin.role === "super_admin" || (admin.permissions ?? []).includes("categories:write");
        const canDelete =
          admin.role === "super_admin" || (admin.permissions ?? []).includes("categories:delete");
        return (
          <AdminShell admin={admin} title="Master Catalog Taxonomy">
            <TaxonomyContent canWrite={canWrite} canDelete={canDelete} />
          </AdminShell>
        );
      }}
    </AdminGuard>
  );
}
