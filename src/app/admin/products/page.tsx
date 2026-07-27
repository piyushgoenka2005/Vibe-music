"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import BulkImportModal from "@/components/admin/BulkImportModal";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import {
  StatusBadge,
  LoadingState,
  EmptyState,
  formatCurrency,
} from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import type { AdminProduct } from "@/types/admin";
import type { Category } from "@/types/category";

async function fetchProducts(params: {
  search: string;
  status: string;
  cursor?: string;
}) {
  const sp = new URLSearchParams({ limit: "20" });
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.cursor) sp.set("cursor", params.cursor);
  const res = await fetch(`/api/admin/products?${sp}`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json() as Promise<{
    products: AdminProduct[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  }>;
}

type ProductsQueryData = Awaited<ReturnType<typeof fetchProducts>>;

type PendingDelete =
  | { type: "single"; product: AdminProduct }
  | { type: "bulk"; ids: string[]; label: string }
  | null;

function ProductsContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } =
    useAdminCursorPagination();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bulkStock, setBulkStock] = useState("");
  const [bulkCategorySlug, setBulkCategorySlug] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const productsQueryKey = ["admin-products", search, status, cursor] as const;

  useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
      return data.categories as Category[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: productsQueryKey,
    queryFn: () => fetchProducts({ search, status, cursor }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Always refetch when landing on this page (e.g. after create/import).
  useEffect(() => {
    void queryClient.invalidateQueries({
      queryKey: ["admin-products"],
      refetchType: "active",
    });
  }, [queryClient]);

  function removeProductsFromCache(ids: string[]) {
    const idSet = new Set(ids);
    queryClient.setQueryData<ProductsQueryData>(productsQueryKey, (old) => {
      if (!old) return old;
      const removedCount = old.products.filter((product) => idSet.has(product.id)).length;
      return {
        ...old,
        products: old.products.filter((product) => !idSet.has(product.id)),
        total: Math.max(0, old.total - removedCount),
      };
    });
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  const invalidate = () => {
    setSelected(new Set());
    void queryClient.invalidateQueries({
      queryKey: ["admin-products"],
      refetchType: "active",
    });
  };

  const bulkMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Bulk action failed");
      return payload;
    },
    onSuccess: (payload) => {
      setPendingDelete(null);
      setActionError(null);
      if (payload.action === "delete" && Array.isArray(payload.ids)) {
        removeProductsFromCache(payload.ids as string[]);
      }
      invalidate();
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : "Bulk action failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      return id;
    },
    onSuccess: (id) => {
      setPendingDelete(null);
      setActionError(null);
      removeProductsFromCache([id]);
      invalidate();
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : "Delete failed");
    },
  });

  function requestDelete(product: AdminProduct) {
    setPendingDelete({ type: "single", product });
  }

  function requestBulkDelete() {
    if (selected.size === 0) return;
    setPendingDelete({
      type: "bulk",
      ids: Array.from(selected),
      label: `${selected.size} selected product${selected.size === 1 ? "" : "s"}`,
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === "single") {
      deleteMutation.mutate(pendingDelete.product.id);
      return;
    }
    bulkMutation.mutate({ action: "delete", ids: pendingDelete.ids });
  }

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      if (!res.ok) throw new Error("Duplicate failed");
    },
    onSuccess: invalidate,
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : "Duplicate failed");
    },
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExportCsv() {
    setExporting(true);
    setActionError(null);
    try {
      const sp = new URLSearchParams({ export: "csv" });
      if (search) sp.set("search", search);
      if (status) sp.set("status", status);
      const res = await fetch(`/api/admin/products?${sp}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibe-products-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) return <LoadingState />;

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;
  const selectedIds = Array.from(selected);

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="Search products…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); reset(); }}
        />
        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={status}
          onChange={(e) => { setStatus(e.target.value); reset(); }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setImportOpen(true)}>
          Import CSV
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={exporting}
          onClick={() => void handleExportCsv()}
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
        {selected.size > 0 ? (
          <>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => bulkMutation.mutate({ action: "activate", ids: selectedIds })}>
              Activate ({selected.size})
            </button>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => bulkMutation.mutate({ action: "archive", ids: selectedIds })}>
              Archive ({selected.size})
            </button>
            <button type="button" className="admin-btn admin-btn--danger" onClick={requestBulkDelete}>
              Delete ({selected.size})
            </button>
            <input
              className="admin-input"
              style={{ width: 100 }}
              type="number"
              min={0}
              placeholder="Stock"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!bulkStock}
              onClick={() => bulkMutation.mutate({ action: "update_stock", ids: selectedIds, stock: Number(bulkStock) })}
            >
              Update Stock
            </button>
            <select
              className="admin-select"
              style={{ width: "auto" }}
              value={bulkCategorySlug}
              onChange={(e) => setBulkCategorySlug(e.target.value)}
            >
              <option value="">Bulk category…</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!bulkCategorySlug}
              onClick={() => {
                const category = categories.find((c) => c.slug === bulkCategorySlug);
                if (!category) return;
                bulkMutation.mutate({
                  action: "update_category",
                  ids: selectedIds,
                  category: category.name,
                  categorySlug: category.slug,
                });
              }}
            >
              Apply Category
            </button>
          </>
        ) : null}
      </div>

      {actionError ? (
        <p className="admin-form-error" style={{ marginBottom: "1rem" }}>
          {actionError}
        </p>
      ) : null}

      <div className="admin-panel">
        {products.length === 0 ? (
          <EmptyState message="No products found." />
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Select all" onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(products.map((p) => p.id)));
                      else setSelected(new Set());
                    }} /></th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>{product.brand}</div>
                      </td>
                      <td>{product.sku ?? "—"}</td>
                      <td>{product.category}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.stockQuantity ?? "—"}</td>
                      <td><StatusBadge status={product.status ?? "active"} /></td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <Link href={`${ROUTES.adminProducts}/${product.id}`} className="admin-btn admin-btn--ghost" style={{ padding: "0.25rem 0.5rem" }}>
                            Edit
                          </Link>
                          <button type="button" className="admin-btn admin-btn--ghost" style={{ padding: "0.25rem 0.5rem" }} onClick={() => duplicateMutation.mutate(product.id)}>
                            Copy
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--icon-danger"
                            title={`Delete ${product.name}`}
                            aria-label={`Delete ${product.name}`}
                            disabled={deleteMutation.isPending}
                            onClick={() => requestDelete(product)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span>{total} products · page {pageIndex + 1}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" className="admin-btn admin-btn--secondary" disabled={!canGoPrev} onClick={goPrev}>Previous</button>
                <button type="button" className="admin-btn admin-btn--secondary" disabled={!hasMore} onClick={() => goNext(data?.nextCursor)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onComplete={invalidate}
      />

      <AdminConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.type === "bulk"
            ? "Delete selected products?"
            : "Delete product?"
        }
        description={
          pendingDelete?.type === "bulk"
            ? `Delete ${pendingDelete.label}? This cannot be undone.`
            : pendingDelete
              ? `Delete "${pendingDelete.product.name}"? This cannot be undone.`
              : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteMutation.isPending || bulkMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (deleteMutation.isPending || bulkMutation.isPending) return;
          setPendingDelete(null);
        }}
      />
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell
          admin={admin}
          title="Products"
          actions={
            <Link href={ROUTES.adminProductNew} className="admin-btn admin-btn--primary">
              Add Product
            </Link>
          }
        >
          <ProductsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
