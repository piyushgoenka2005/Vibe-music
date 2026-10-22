"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Sliders,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import type { ProductAttribute } from "@/lib/server/catalog/attributesRepository";

const CATEGORY_TABS = [
  "All",
  "Guitars & Basses",
  "Keyboards & Synthesizers",
  "Drums & Percussion",
  "Studio & Audio",
  "Amps & Effects",
] as const;

interface AttributeFormState {
  name: string;
  code: string;
  category: string;
  type: "select" | "multiselect" | "text" | "number" | "boolean";
  isFilterable: boolean;
  isRequired: boolean;
  description: string;
  values: string[];
}

const EMPTY_FORM: AttributeFormState = {
  name: "",
  code: "",
  category: "Guitars & Basses",
  type: "select",
  isFilterable: true,
  isRequired: false,
  description: "",
  values: [],
};

function AttributesContent({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AttributeFormState>(EMPTY_FORM);
  const [newValueInput, setNewValueInput] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-attributes", search, selectedCategory],
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      return adminFetchJson<{
        attributes: ProductAttribute[];
        stats: {
          total: number;
          filterable: number;
          categoriesCount: number;
          totalValues: number;
        };
      }>(`/api/admin/attributes?${params.toString()}`);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editingId ? `/api/admin/attributes/${editingId}` : "/api/admin/attributes";
      await adminMutateJson(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    },
    onSuccess: () => {
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminMutateJson(`/api/admin/attributes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
    },
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (attr: ProductAttribute) => {
    setEditingId(attr.id);
    setForm({
      name: attr.name,
      code: attr.code,
      category: attr.category,
      type: attr.type,
      isFilterable: attr.isFilterable,
      isRequired: attr.isRequired,
      description: attr.description || "",
      values: [...attr.values],
    });
    setShowModal(true);
  };

  const handleAddValue = () => {
    const val = newValueInput.trim();
    if (!val || form.values.includes(val)) return;
    setForm((prev) => ({ ...prev, values: [...prev.values, val] }));
    setNewValueInput("");
  };

  const handleRemoveValue = (index: number) => {
    setForm((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load product attributes."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const attributes = data?.attributes ?? [];
  const stats = data?.stats ?? {
    total: attributes.length,
    filterable: attributes.filter((a) => a.isFilterable).length,
    categoriesCount: 6,
    totalValues: attributes.reduce((acc, curr) => acc + curr.values.length, 0),
  };

  return (
    <div className="admin-page">
      {/* KPI Stats */}
      <div className="admin-grid admin-grid--4" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Total Attributes</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}
            >
              <Tag size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.total}</div>
          <div className="admin-kpi__sub">Product specifications</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Filterable in Store</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-success-soft)", color: "var(--admin-success)" }}
            >
              <Sliders size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.filterable}</div>
          <div className="admin-kpi__sub">Active storefront filters</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Categories Covered</span>
            <span
              className="admin-kpi__icon"
              style={{
                background: "var(--admin-kpi-products-soft)",
                color: "var(--admin-kpi-products)",
              }}
            >
              <Layers size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.categoriesCount}</div>
          <div className="admin-kpi__sub">Gear departments</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Total Values</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-warning-soft)", color: "var(--admin-warning)" }}
            >
              <Sparkles size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.totalValues}</div>
          <div className="admin-kpi__sub">Option values defined</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="admin-card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ display: "flex", gap: "0.5rem", flex: "1 1 300px", maxWidth: "450px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                className="admin-input"
                style={{ paddingLeft: "2.5rem", width: "100%" }}
                placeholder="Search attributes, codes, or values…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
              />
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--admin-muted)",
                }}
              />
            </div>
            {searchInput !== search && (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setSearch(searchInput)}
              >
                Apply
              </button>
            )}
            {search && (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Action */}
          {canWrite && (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              Add Attribute
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            marginTop: "1rem",
            paddingBottom: "0.25rem",
          }}
        >
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`admin-btn ${selectedCategory === cat ? "admin-btn--primary" : "admin-btn--secondary"}`}
              style={{ fontSize: "0.8125rem", padding: "0.35rem 0.85rem", borderRadius: "9999px" }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Attributes Table */}
      {attributes.length === 0 ? (
        <EmptyState
          message={
            search
              ? "No attributes match your search filter."
              : "No product attributes found. Click 'Add Attribute' above to create your first specification attribute."
          }
        />
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Attribute Name & Code</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Filterable</th>
                  <th>Required</th>
                  <th>Values Preview</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr) => (
                  <tr key={attr.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>{attr.name}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--admin-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {attr.code}
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge--neutral">{attr.category}</span>
                    </td>
                    <td>
                      <span
                        className="admin-badge admin-badge--info"
                        style={{ textTransform: "capitalize" }}
                      >
                        {attr.type}
                      </span>
                    </td>
                    <td>
                      {attr.isFilterable ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color: "var(--admin-success)",
                            fontSize: "0.8125rem",
                          }}
                        >
                          <CheckCircle2 size={14} /> Yes
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color: "var(--admin-muted)",
                            fontSize: "0.8125rem",
                          }}
                        >
                          <XCircle size={14} /> No
                        </span>
                      )}
                    </td>
                    <td>
                      {attr.isRequired ? (
                        <span className="admin-badge admin-badge--warning">Required</span>
                      ) : (
                        <span style={{ color: "var(--admin-muted)", fontSize: "0.8125rem" }}>
                          Optional
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: "280px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {attr.values.slice(0, 3).map((v) => (
                          <span
                            key={v}
                            style={{
                              fontSize: "0.75rem",
                              background: "var(--admin-surface-2)",
                              border: "1px solid var(--admin-border)",
                              borderRadius: "4px",
                              padding: "0.1rem 0.4rem",
                              color: "var(--admin-text)",
                            }}
                          >
                            {v}
                          </span>
                        ))}
                        {attr.values.length > 3 && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--admin-muted)",
                              alignSelf: "center",
                            }}
                          >
                            +{attr.values.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        {canWrite && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary"
                            style={{ padding: "0.35rem 0.6rem" }}
                            onClick={() => handleOpenEdit(attr)}
                            title="Edit Attribute"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger"
                            style={{ padding: "0.35rem 0.6rem" }}
                            onClick={() => setDeleteConfirmId(attr.id)}
                            title="Delete Attribute"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: "560px", width: "95%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {editingId ? "Edit Product Attribute" : "Add New Attribute"}
              </h2>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ padding: "0.35rem" }}
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="admin-label">Attribute Name</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    placeholder="e.g. Fretboard Material"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name,
                        code: editingId
                          ? prev.code
                          : name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                      }));
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="admin-label">Code / Key</label>
                    <input
                      type="text"
                      required
                      className="admin-input"
                      placeholder="e.g. fretboard_material"
                      value={form.code}
                      disabled={Boolean(editingId)}
                      onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="admin-label">Category</label>
                    <select
                      className="admin-select"
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      {CATEGORY_TABS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Input Type</label>
                  <select
                    className="admin-select"
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        type: e.target.value as AttributeFormState["type"],
                      }))
                    }
                  >
                    <option value="select">Dropdown Select (Single choice)</option>
                    <option value="multiselect">Multi-Select (Multiple choices)</option>
                    <option value="text">Freeform Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Yes / No (Boolean)</option>
                  </select>
                </div>

                {/* Values Chip Manager (for select & multiselect) */}
                {(form.type === "select" || form.type === "multiselect") && (
                  <div>
                    <label className="admin-label">Option Values</label>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Add value option (e.g. Rosewood) and press Enter"
                        value={newValueInput}
                        onChange={(e) => setNewValueInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddValue();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        onClick={handleAddValue}
                      >
                        Add
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.35rem",
                        padding: "0.75rem",
                        background: "var(--admin-surface-2)",
                        borderRadius: "var(--admin-radius-sm)",
                        border: "1px solid var(--admin-border)",
                        minHeight: "48px",
                      }}
                    >
                      {form.values.length === 0 ? (
                        <span style={{ color: "var(--admin-muted)", fontSize: "0.8125rem" }}>
                          No values added yet. Type a value and click Add.
                        </span>
                      ) : (
                        form.values.map((val, idx) => (
                          <span
                            key={val}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontSize: "0.8125rem",
                              background: "var(--admin-surface)",
                              border: "1px solid var(--admin-border)",
                              borderRadius: "9999px",
                              padding: "0.15rem 0.55rem",
                              color: "var(--admin-text)",
                            }}
                          >
                            {val}
                            <button
                              type="button"
                              onClick={() => handleRemoveValue(idx)}
                              style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                color: "var(--admin-muted)",
                                display: "inline-flex",
                                padding: 0,
                              }}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.isFilterable}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, isFilterable: e.target.checked }))
                      }
                    />
                    <span style={{ fontSize: "0.875rem" }}>Show in storefront filter bar</span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.isRequired}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, isRequired: e.target.checked }))
                      }
                    />
                    <span style={{ fontSize: "0.875rem" }}>Mandatory for new products</span>
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
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn--primary"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending
                      ? "Saving…"
                      : editingId
                        ? "Update Attribute"
                        : "Create Attribute"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: "420px", width: "95%" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Delete Attribute?
            </h3>
            <p
              style={{ color: "var(--admin-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}
            >
              Are you sure you want to remove this specification attribute? Existing products with
              this attribute will retain their stored specs.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
              >
                {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAttributesPage() {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell admin={session} title="Product Attributes & Specs">
          <AttributesContent
            canWrite={session.permissions.includes("categories:write")}
            canDelete={session.permissions.includes("categories:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
