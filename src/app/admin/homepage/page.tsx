"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import {
  EmptyState,
  LoadingState,
  StatusBadge,
} from "@/components/admin/AdminUi";
import {
  HOMEPAGE_SECTION_KEYS,
  HOMEPAGE_SECTION_LABELS,
  type HomepageSection,
  type HomepageSectionItem,
  type HomepageSectionKey,
} from "@/types/homepage";
import { BIG_NAMES_DEALS_MAX_ITEMS } from "@/lib/homepage/bigNamesDeals";
import type { AdminProduct } from "@/types/admin";

const QUERY_KEY = ["admin-homepage"] as const;

const EMPTY_ITEM = {
  productId: "",
  categorySlug: "",
  brandId: "",
  customImage: "",
  customTitle: "",
  customHref: "",
  badgeLabel: "",
  offerText: "",
};

function itemLabel(
  item: HomepageSectionItem,
  productNames: Map<string, string>
): string {
  if (item.productId) {
    return productNames.get(item.productId) ?? `Product: ${item.productId}`;
  }
  if (item.categorySlug) return `Category: ${item.categorySlug}`;
  if (item.brandId) return `Brand: ${item.brandId}`;
  if (item.customTitle) return item.customTitle;
  return item.id;
}

function HomepageContent() {
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState<HomepageSectionKey>("new_arrivals");
  const [sectionForm, setSectionForm] = useState<Partial<HomepageSection>>({});
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/admin/homepage");
      if (!res.ok) throw new Error("Failed to load homepage config");
      return res.json() as Promise<{
        sections: HomepageSection[];
        items: HomepageSectionItem[];
      }>;
    },
  });

  const { data: guitarProducts = [] } = useQuery({
    queryKey: ["admin-homepage-guitars"],
    queryFn: async () => {
      const res = await fetch("/api/admin/products?category=guitars&limit=200");
      if (!res.ok) throw new Error("Failed to load guitar products");
      const body = (await res.json()) as { products?: AdminProduct[] };
      return body.products ?? [];
    },
    enabled: activeKey === "big_names_deals",
  });

  const sections = useMemo(
    () => [...(data?.sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [data?.sections]
  );

  const activeSection = sections.find((section) => section.sectionKey === activeKey);
  const sectionItems = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.sectionKey === activeKey)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [data?.items, activeKey]
  );

  const productNameMap = useMemo(
    () =>
      new Map(
        guitarProducts.map((product) => [
          product.id,
          `${product.brand} — ${product.name}`,
        ])
      ),
    [guitarProducts]
  );

  const saveSectionMutation = useMutation({
    mutationFn: async () => {
      if (!activeSection) throw new Error("Section not found");
      const res = await fetch(`/api/admin/homepage/sections/${activeKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionForm.title ?? activeSection.title,
          subtitle: sectionForm.subtitle ?? activeSection.subtitle ?? "",
          accentLabel: sectionForm.accentLabel ?? activeSection.accentLabel ?? "",
          ctaText: sectionForm.ctaText ?? activeSection.ctaText ?? "",
          ctaLink: sectionForm.ctaLink ?? activeSection.ctaLink ?? "",
          isActive: sectionForm.isActive ?? activeSection.isActive,
          sourceMode:
            activeKey === "big_names_deals"
              ? "manual"
              : (sectionForm.sourceMode ?? activeSection.sourceMode),
          maxItems:
            activeKey === "big_names_deals"
              ? BIG_NAMES_DEALS_MAX_ITEMS
              : (sectionForm.maxItems ?? activeSection.maxItems),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Save failed");
    },
    onSuccess: () => {
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/homepage/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey: activeKey,
          productId: itemForm.productId || undefined,
          categorySlug: itemForm.categorySlug || undefined,
          brandId: itemForm.brandId || undefined,
          customImage: itemForm.customImage || undefined,
          customTitle: itemForm.customTitle || undefined,
          customHref: itemForm.customHref || undefined,
          badgeLabel: itemForm.badgeLabel || undefined,
          offerText: itemForm.offerText || undefined,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Add item failed");
    },
    onSuccess: () => {
      setItemForm(EMPTY_ITEM);
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/homepage/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const toggleItemMutation = useMutation({
    mutationFn: async (item: HomepageSectionItem) => {
      const res = await fetch(`/api/admin/homepage/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await fetch("/api/admin/homepage/items/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey: activeKey, orderedIds }),
      });
      if (!res.ok) throw new Error("Reorder failed");
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  function selectSection(key: HomepageSectionKey) {
    setActiveKey(key);
    setFormError(null);
    setItemForm(EMPTY_ITEM);
    const section = sections.find((entry) => entry.sectionKey === key);
    if (section) {
      setSectionForm({
        title: section.title,
        subtitle: section.subtitle,
        accentLabel: section.accentLabel,
        ctaText: section.ctaText,
        ctaLink: section.ctaLink,
        isActive: section.isActive,
        sourceMode: section.sourceMode,
        maxItems: section.maxItems,
      });
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sectionItems.length) return;
    const ordered = [...sectionItems];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, moved!);
    reorderMutation.mutate(ordered.map((item) => item.id));
  }

  if (isLoading) return <LoadingState message="Loading homepage sections…" />;
  if (!activeSection) return <EmptyState message="No homepage sections found." />;

  const form = {
    title: sectionForm.title ?? activeSection.title,
    subtitle: sectionForm.subtitle ?? activeSection.subtitle ?? "",
    accentLabel: sectionForm.accentLabel ?? activeSection.accentLabel ?? "",
    ctaText: sectionForm.ctaText ?? activeSection.ctaText ?? "",
    ctaLink: sectionForm.ctaLink ?? activeSection.ctaLink ?? "",
    isActive: sectionForm.isActive ?? activeSection.isActive,
    sourceMode: sectionForm.sourceMode ?? activeSection.sourceMode,
    maxItems: sectionForm.maxItems ?? activeSection.maxItems,
  };

  const isBigNamesSection = activeKey === "big_names_deals";
  const isProductSection =
    activeKey !== "featured_categories" &&
    activeKey !== "brand_strip";
  const isCategorySection = activeKey === "featured_categories";
  const isBrandSection = activeKey === "brand_strip";
  const canAddBigNamesItem =
    !isBigNamesSection || sectionItems.length < BIG_NAMES_DEALS_MAX_ITEMS;

  return (
    <>
      <div className="admin-toolbar" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        {HOMEPAGE_SECTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`admin-btn${activeKey === key ? " admin-btn--primary" : " admin-btn--secondary"}`}
            onClick={() => selectSection(key)}
          >
            {HOMEPAGE_SECTION_LABELS[key]}
          </button>
        ))}
      </div>

      {formError ? (
        <p style={{ color: "#c41e3a", marginBottom: 12 }} role="alert">
          {formError}
        </p>
      ) : null}

      <div className="admin-panel" style={{ marginBottom: "1rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">{HOMEPAGE_SECTION_LABELS[activeKey]} Settings</h2>
        </div>
        <div className="admin-panel__body">
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>{isBigNamesSection ? "Headline" : "Title"}</label>
              <input
                className="admin-input"
                style={{ width: "100%" }}
                value={form.title}
                onChange={(event) =>
                  setSectionForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>
            <div className="admin-form-group">
              <label>Subtitle</label>
              <input
                className="admin-input"
                style={{ width: "100%" }}
                value={form.subtitle}
                onChange={(event) =>
                  setSectionForm((prev) => ({ ...prev, subtitle: event.target.value }))
                }
              />
            </div>
            {activeKey === "deals_of_the_day" || isBigNamesSection ? (
              <div className="admin-form-group">
                <label>{isBigNamesSection ? "Eyebrow" : "Accent Label"}</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.accentLabel}
                  onChange={(event) =>
                    setSectionForm((prev) => ({ ...prev, accentLabel: event.target.value }))
                  }
                />
              </div>
            ) : null}
            <div className="admin-form-group">
              <label>CTA Text</label>
              <input
                className="admin-input"
                style={{ width: "100%" }}
                value={form.ctaText}
                onChange={(event) =>
                  setSectionForm((prev) => ({ ...prev, ctaText: event.target.value }))
                }
              />
            </div>
            <div className="admin-form-group">
              <label>CTA Link</label>
              <input
                className="admin-input"
                style={{ width: "100%" }}
                value={form.ctaLink}
                onChange={(event) =>
                  setSectionForm((prev) => ({ ...prev, ctaLink: event.target.value }))
                }
              />
            </div>
            <div className="admin-form-group">
              <label>Max Items</label>
              <input
                className="admin-input"
                type="number"
                min={1}
                max={50}
                style={{ width: "100%" }}
                value={isBigNamesSection ? BIG_NAMES_DEALS_MAX_ITEMS : form.maxItems}
                disabled={isBigNamesSection}
                onChange={(event) =>
                  setSectionForm((prev) => ({
                    ...prev,
                    maxItems: Number(event.target.value),
                  }))
                }
              />
            </div>
            {!isBigNamesSection ? (
            <div className="admin-form-group">
              <label>Source Mode</label>
              <select
                className="admin-input"
                style={{ width: "100%" }}
                value={form.sourceMode}
                onChange={(event) =>
                  setSectionForm((prev) => ({
                    ...prev,
                    sourceMode: event.target.value as HomepageSection["sourceMode"],
                  }))
                }
              >
                <option value="auto">Auto (catalog flags / sorting)</option>
                <option value="manual">Manual curation</option>
              </select>
            </div>
            ) : (
              <div className="admin-form-group">
                <p className="admin-form-hint" style={{ margin: 0 }}>
                  Manual curation only. Pick up to {BIG_NAMES_DEALS_MAX_ITEMS} guitar products below.
                </p>
              </div>
            )}
            <div className="admin-form-group">
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setSectionForm((prev) => ({ ...prev, isActive: event.target.checked }))
                  }
                />
                Section active
              </label>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saveSectionMutation.isPending}
              onClick={() => saveSectionMutation.mutate()}
            >
              Save Section
            </button>
          </div>
        </div>
      </div>

      {(form.sourceMode === "manual" || isBigNamesSection) ? (
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Curated Items</h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              {isProductSection ? (
                isBigNamesSection ? (
                  <div className="admin-form-group">
                    <label>Guitar product</label>
                    <select
                      className="admin-select"
                      style={{ width: "100%" }}
                      value={itemForm.productId}
                      onChange={(event) =>
                        setItemForm((prev) => ({ ...prev, productId: event.target.value }))
                      }
                    >
                      <option value="">Select a guitar</option>
                      {guitarProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.brand} — {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                <div className="admin-form-group">
                  <label>Product ID</label>
                  <input
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={itemForm.productId}
                    onChange={(event) =>
                      setItemForm((prev) => ({ ...prev, productId: event.target.value }))
                    }
                    placeholder="Catalog product ID"
                  />
                </div>
                )
              ) : null}
              {isCategorySection ? (
                <div className="admin-form-group">
                  <label>Category Slug</label>
                  <input
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={itemForm.categorySlug}
                    onChange={(event) =>
                      setItemForm((prev) => ({ ...prev, categorySlug: event.target.value }))
                    }
                  />
                </div>
              ) : null}
              {isBrandSection ? (
                <div className="admin-form-group">
                  <label>Brand ID / Slug</label>
                  <input
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={itemForm.brandId}
                    onChange={(event) =>
                      setItemForm((prev) => ({ ...prev, brandId: event.target.value }))
                    }
                  />
                </div>
              ) : null}
              {!isBigNamesSection ? (
              <div className="admin-form-group">
                <label>Custom Title</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={itemForm.customTitle}
                  onChange={(event) =>
                    setItemForm((prev) => ({ ...prev, customTitle: event.target.value }))
                  }
                />
              </div>
              ) : null}
              {!isBigNamesSection ? (
              <div className="admin-form-group">
                <label>Custom Image URL</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={itemForm.customImage}
                  onChange={(event) =>
                    setItemForm((prev) => ({ ...prev, customImage: event.target.value }))
                  }
                />
              </div>
              ) : null}
              {!isBigNamesSection ? (
              <div className="admin-form-group">
                <label>Custom Link</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={itemForm.customHref}
                  onChange={(event) =>
                    setItemForm((prev) => ({ ...prev, customHref: event.target.value }))
                  }
                />
              </div>
              ) : null}
              {isProductSection && !isBigNamesSection ? (
                <div className="admin-form-group">
                  <label>Offer Text</label>
                  <input
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={itemForm.offerText}
                    onChange={(event) =>
                      setItemForm((prev) => ({ ...prev, offerText: event.target.value }))
                    }
                  />
                </div>
              ) : null}
              <div className="admin-form-group">
                {!isBigNamesSection ? (
                <label>Badge Label</label>
                ) : null}
                {!isBigNamesSection ? (
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={itemForm.badgeLabel}
                  onChange={(event) =>
                    setItemForm((prev) => ({ ...prev, badgeLabel: event.target.value }))
                  }
                />
                ) : null}
              </div>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={addItemMutation.isPending || !canAddBigNamesItem}
                onClick={() => addItemMutation.mutate()}
              >
                <Plus size={16} />{" "}
                {isBigNamesSection ? "Add Guitar" : "Add Item"}
              </button>
              {isBigNamesSection && !canAddBigNamesItem ? (
                <p className="admin-form-hint" style={{ marginTop: 8 }}>
                  Maximum {BIG_NAMES_DEALS_MAX_ITEMS} guitars reached.
                </p>
              ) : null}
            </div>

            {sectionItems.length === 0 ? (
              <EmptyState message="No curated items yet. Add items above or switch to auto mode." />
            ) : (
              <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Status</th>
                      <th>Order</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionItems.map((item, index) => (
                      <tr key={item.id}>
                        <td>{itemLabel(item, productNameMap)}</td>
                        <td>
                          <StatusBadge status={item.isActive ? "active" : "inactive"} />
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              disabled={index === 0}
                              onClick={() => moveItem(index, -1)}
                              aria-label="Move up"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              disabled={index === sectionItems.length - 1}
                              onClick={() => moveItem(index, 1)}
                              aria-label="Move down"
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              onClick={() => toggleItemMutation.mutate(item)}
                            >
                              {item.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-panel">
          <div className="admin-panel__body">
            <p style={{ color: "var(--admin-muted)", margin: 0 }}>
              Auto mode pulls live catalog data: new arrivals, trending, featured (staff picks),
              review-count leaders (best sellers), discounted products (deals), featured categories,
              or brand list.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminHomepagePage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Homepage Sections">
          <HomepageContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
