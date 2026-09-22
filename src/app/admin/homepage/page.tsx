"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import BannerImageUpload from "@/components/admin/BannerImageUpload";
import { EmptyState, LoadingState, StatusBadge } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
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

function itemLabel(item: HomepageSectionItem, productNames: Map<string, string>): string {
  if (item.productId) {
    return productNames.get(item.productId) ?? `Product: ${item.productId}`;
  }
  if (item.categorySlug) return `Category: ${item.categorySlug}`;
  if (item.brandId) return `Brand: ${item.brandId}`;
  if (item.customTitle) return item.customTitle;
  return item.id;
}

function HomepageContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState<HomepageSectionKey>("new_arrivals");
  const [sectionForm, setSectionForm] = useState<Partial<HomepageSection>>({});
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<AdminProduct[]>([]);
  const [productSearching, setProductSearching] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
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

  const { data: catalogBrands = [] } = useQuery({
    queryKey: ["admin-homepage-brands"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brands");
      if (!res.ok) throw new Error("Failed to load brands");
      const body = (await res.json()) as {
        brands?: Array<{ id: string; name: string; slug: string }>;
      };
      return body.brands ?? [];
    },
    enabled: activeKey === "brand_strip",
  });

  const { data: catalogProductCount } = useQuery({
    queryKey: ["admin-homepage-product-count"],
    queryFn: async () => {
      const res = await fetch("/api/admin/products?limit=1");
      if (!res.ok) return null;
      const body = (await res.json()) as { total?: number; products?: AdminProduct[] };
      return body.total ?? body.products?.length ?? 0;
    },
  });

  async function runProductSearch(query: string) {
    setProductSearch(query);
    if (query.trim().length < 2) {
      setProductResults([]);
      return;
    }
    setProductSearching(true);
    try {
      const res = await fetch(
        `/api/admin/products?search=${encodeURIComponent(query.trim())}&limit=12`,
      );
      const body = (await res.json()) as { products?: AdminProduct[] };
      setProductResults(body.products ?? []);
    } finally {
      setProductSearching(false);
    }
  }

  const sections = useMemo(
    () => [...(data?.sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [data?.sections],
  );

  const activeSection = sections.find((section) => section.sectionKey === activeKey);
  const sectionItems = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.sectionKey === activeKey)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [data?.items, activeKey],
  );

  const productNameMap = useMemo(() => {
    const map = new Map(
      guitarProducts.map((product) => [product.id, `${product.brand} — ${product.name}`]),
    );
    for (const product of productResults) {
      map.set(product.id, `${product.brand} — ${product.name}`);
    }
    return map;
  }, [guitarProducts, productResults]);

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
            activeKey === "big_names_deals" ||
            activeKey === "featured_stories" ||
            activeKey === "featured_categories" ||
            activeKey === "browse_by_categories" ||
            activeKey === "category_bento"
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
      setSaveNotice("Section saved. Storefront cache refreshed — reload the homepage to verify.");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sectionKey: activeKey,
        productId: itemForm.productId || undefined,
        categorySlug: itemForm.categorySlug || undefined,
        brandId: itemForm.brandId || undefined,
        customImage: itemForm.customImage || undefined,
        customTitle: itemForm.customTitle || undefined,
        customHref: itemForm.customHref || undefined,
        badgeLabel: itemForm.badgeLabel || undefined,
        offerText: itemForm.offerText || undefined,
      };
      const url = editingItemId
        ? `/api/admin/homepage/items/${editingItemId}`
        : "/api/admin/homepage/items";
      const res = await fetch(url, {
        method: editingItemId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok)
        throw new Error(body.error ?? (editingItemId ? "Update failed" : "Add item failed"));
    },
    onSuccess: () => {
      setItemForm(EMPTY_ITEM);
      setEditingItemId(null);
      setProductSearch("");
      setProductResults([]);
      setFormError(null);
      setSaveNotice("Item saved. Storefront cache refreshed — reload the homepage to verify.");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/homepage/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      setSaveNotice("Item removed. Storefront cache refreshed.");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
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
    onSuccess: () => {
      setSaveNotice("Item status updated. Storefront cache refreshed.");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
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
    onSuccess: () => {
      setSaveNotice("Order updated. Storefront cache refreshed.");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  function selectSection(key: HomepageSectionKey) {
    setActiveKey(key);
    setFormError(null);
    setSaveNotice(null);
    setEditingItemId(null);
    setItemForm(EMPTY_ITEM);
    setProductSearch("");
    setProductResults([]);
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
  if (isError) {
    return (
      <ErrorState
        message="Unable to load homepage configuration."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }
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

  const isStorySection = activeKey === "featured_stories";
  const isBigNamesSection = activeKey === "big_names_deals";
  const isCategorySection =
    activeKey === "featured_categories" ||
    activeKey === "browse_by_categories" ||
    activeKey === "category_bento";
  const isBentoSection = activeKey === "category_bento";
  const isBrowseSection = activeKey === "browse_by_categories";
  const isProductSection =
    activeKey !== "featured_categories" &&
    activeKey !== "browse_by_categories" &&
    activeKey !== "category_bento" &&
    activeKey !== "brand_strip" &&
    activeKey !== "featured_stories";
  const isBrandSection = activeKey === "brand_strip";
  const forceManualSource = isStorySection || isBigNamesSection || isCategorySection;
  const canAddBigNamesItem = !isBigNamesSection || sectionItems.length < BIG_NAMES_DEALS_MAX_ITEMS;
  const showCatalogEmptyWarning =
    isProductSection &&
    !isBigNamesSection &&
    form.sourceMode === "auto" &&
    catalogProductCount === 0;

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
        <a
          className="admin-btn admin-btn--secondary"
          href="/"
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: "auto" }}
        >
          Preview storefront ↗
        </a>
      </div>

      {formError ? (
        <p style={{ color: "#c41e3a", marginBottom: 12 }} role="alert">
          {formError}
        </p>
      ) : null}
      {saveNotice ? (
        <p style={{ color: "#0a7a3e", marginBottom: 12 }} role="status">
          {saveNotice}
        </p>
      ) : null}
      {showCatalogEmptyWarning ? (
        <p
          style={{
            color: "#8a5a00",
            background: "#fff8e6",
            border: "1px solid #f0d78c",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            marginBottom: 12,
          }}
          role="status"
        >
          Catalog has 0 products. Auto sections (New Arrivals, Best Sellers, Trending, Staff Picks,
          Deals) stay empty until you import products. Switch to Manual and add product IDs, or run
          bulk import first.
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
            {activeKey === "deals_of_the_day" || isBigNamesSection || isBentoSection ? (
              <div className="admin-form-group">
                <label>
                  {isBigNamesSection
                    ? "Eyebrow"
                    : isBentoSection
                      ? "Card CTA label (Explore Category)"
                      : "Accent Label"}
                </label>
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
            {!isBigNamesSection && !isStorySection && !forceManualSource ? (
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
            ) : isBigNamesSection ? (
              <div className="admin-form-group">
                <p className="admin-form-hint" style={{ margin: 0 }}>
                  Manual curation only. Pick up to {BIG_NAMES_DEALS_MAX_ITEMS} guitar products
                  below.
                </p>
              </div>
            ) : isCategorySection ? (
              <div className="admin-form-group">
                <p className="admin-form-hint" style={{ margin: 0 }}>
                  Manual curation only. Edit title, CTA, images, links
                  {isBentoSection ? ", badges, subcategory and brand lines" : ""}
                  {isBrowseSection ? ", and card photos" : ""} below. Use Manual source mode.
                </p>
              </div>
            ) : (
              <div className="admin-form-group">
                <p className="admin-form-hint" style={{ margin: 0 }}>
                  Manual curation only. Manage full-width A+ story banners (image, heading,
                  destination link) below.
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
            {canWrite ? (
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={saveSectionMutation.isPending}
                onClick={() => saveSectionMutation.mutate()}
              >
                Save Section
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {form.sourceMode === "manual" || isBigNamesSection || isStorySection || forceManualSource ? (
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              {isStorySection ? "Story Banners" : "Curated Items"}
            </h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              {isStorySection ? (
                <>
                  <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                    <BannerImageUpload
                      label="Story Banner Image (upload directly to CDN)"
                      value={itemForm.customImage}
                      onChange={(url) => setItemForm((prev) => ({ ...prev, customImage: url }))}
                    />
                  </div>
                  <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Or Image URL / Path</label>
                    <input
                      className="admin-input"
                      style={{ width: "100%" }}
                      value={itemForm.customImage}
                      placeholder="/images/guitar-1.webp or https://cdn.vibemusic.in/..."
                      onChange={(event) =>
                        setItemForm((prev) => ({ ...prev, customImage: event.target.value }))
                      }
                    />
                  </div>
                  <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Story Title / Alt Text (Heading)</label>
                    <input
                      className="admin-input"
                      style={{ width: "100%" }}
                      value={itemForm.customTitle}
                      placeholder="e.g. An integrated coil-tap for total tonal freedom"
                      onChange={(event) =>
                        setItemForm((prev) => ({ ...prev, customTitle: event.target.value }))
                      }
                    />
                  </div>
                  <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Destination Link (Optional click action)</label>
                    <input
                      className="admin-input"
                      style={{ width: "100%" }}
                      value={itemForm.customHref}
                      placeholder="/category/guitars"
                      onChange={(event) =>
                        setItemForm((prev) => ({ ...prev, customHref: event.target.value }))
                      }
                    />
                  </div>
                </>
              ) : (
                <>
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
                      <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Search catalog product</label>
                        <input
                          className="admin-input"
                          style={{ width: "100%" }}
                          value={productSearch}
                          onChange={(event) => void runProductSearch(event.target.value)}
                          placeholder="Type 2+ characters to search…"
                        />
                        {productSearching ? <p className="admin-form-hint">Searching…</p> : null}
                        {productResults.length > 0 ? (
                          <ul
                            style={{
                              listStyle: "none",
                              margin: "0.5rem 0 0",
                              padding: 0,
                              border: "1px solid var(--admin-border, #333)",
                              borderRadius: 8,
                              maxHeight: 220,
                              overflow: "auto",
                            }}
                          >
                            {productResults.map((product) => (
                              <li key={product.id}>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--ghost"
                                  style={{
                                    width: "100%",
                                    justifyContent: "flex-start",
                                    borderRadius: 0,
                                  }}
                                  onClick={() => {
                                    setItemForm((prev) => ({
                                      ...prev,
                                      productId: product.id,
                                      customTitle: prev.customTitle || product.name,
                                    }));
                                    setProductSearch(`${product.brand} — ${product.name}`);
                                    setProductResults([]);
                                  }}
                                >
                                  {product.brand} — {product.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <label style={{ marginTop: 8, display: "block" }}>
                          Selected Product ID
                        </label>
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
                      <label>Brand</label>
                      <select
                        className="admin-select"
                        style={{ width: "100%" }}
                        value={itemForm.brandId}
                        onChange={(event) => {
                          const brand = catalogBrands.find(
                            (entry) => entry.id === event.target.value,
                          );
                          setItemForm((prev) => ({
                            ...prev,
                            brandId: event.target.value,
                            customTitle: brand?.name || prev.customTitle,
                            customHref: brand
                              ? `/search/results?brand=${encodeURIComponent(brand.slug)}`
                              : prev.customHref,
                          }));
                        }}
                      >
                        <option value="">Select a brand</option>
                        {catalogBrands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name} ({brand.slug})
                          </option>
                        ))}
                      </select>
                      <label style={{ marginTop: 8, display: "block" }}>Or Brand ID / Slug</label>
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
                  {isCategorySection || isBrandSection ? (
                    <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                      <BannerImageUpload
                        label={isBrandSection ? "Brand logo (optional)" : "Card / category image"}
                        value={itemForm.customImage}
                        onChange={(url) => setItemForm((prev) => ({ ...prev, customImage: url }))}
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
                  {isBentoSection ? (
                    <div className="admin-form-group">
                      <label>Subcategories + Brands</label>
                      <textarea
                        className="admin-input"
                        style={{ width: "100%", minHeight: 64 }}
                        value={itemForm.offerText}
                        onChange={(event) =>
                          setItemForm((prev) => ({ ...prev, offerText: event.target.value }))
                        }
                        placeholder={"Acoustic • Electric • Bass\nFender • Gibson • Ibanez"}
                      />
                      <p className="admin-form-hint" style={{ margin: "0.35rem 0 0" }}>
                        Line 1 = subcategory tags. Line 2 = brand names.
                      </p>
                    </div>
                  ) : null}
                  <div className="admin-form-group">
                    {!isBigNamesSection ? <label>Badge Label</label> : null}
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
                </>
              )}
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {canWrite ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={addItemMutation.isPending || (!editingItemId && !canAddBigNamesItem)}
                  onClick={() => addItemMutation.mutate()}
                >
                  <Plus size={16} />{" "}
                  {editingItemId
                    ? isStorySection
                      ? "Update Story Banner"
                      : "Update Item"
                    : isStorySection
                      ? "Add Story Banner"
                      : isBigNamesSection
                        ? "Add Guitar"
                        : "Add Item"}
                </button>
              ) : null}
              {canWrite && editingItemId ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => {
                    setEditingItemId(null);
                    setItemForm(EMPTY_ITEM);
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
              {isBigNamesSection && !canAddBigNamesItem && !editingItemId ? (
                <p className="admin-form-hint" style={{ marginTop: 8, width: "100%" }}>
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
                        <td>
                          {isStorySection ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {item.customImage ? (
                                <Image
                                  src={item.customImage}
                                  alt={item.customTitle || "Banner thumbnail"}
                                  width={180}
                                  height={80}
                                  unoptimized
                                  style={{
                                    width: 90,
                                    height: 40,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                    background: "#111",
                                    border: "1px solid var(--admin-border, #333)",
                                  }}
                                />
                              ) : null}
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {item.customTitle || "Untitled Story Banner"}
                                </div>
                                {item.customHref ? (
                                  <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                                    Link: {item.customHref}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            itemLabel(item, productNameMap)
                          )}
                        </td>
                        <td>
                          <StatusBadge status={item.isActive ? "active" : "inactive"} />
                        </td>
                        <td>
                          {canWrite ? (
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
                          ) : (
                            index + 1
                          )}
                        </td>
                        <td>
                          {canWrite ? (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost"
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setItemForm({
                                    productId: item.productId ?? "",
                                    categorySlug: item.categorySlug ?? "",
                                    brandId: item.brandId ?? "",
                                    customImage: item.customImage ?? "",
                                    customTitle: item.customTitle ?? "",
                                    customHref: item.customHref ?? "",
                                    badgeLabel: item.badgeLabel ?? "",
                                    offerText: item.offerText ?? "",
                                  });
                                }}
                              >
                                Edit
                              </button>
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
                          ) : (
                            "—"
                          )}
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
          <HomepageContent canWrite={admin.permissions.includes("homepage:write")} />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
