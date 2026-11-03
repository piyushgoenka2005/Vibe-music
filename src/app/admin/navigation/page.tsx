"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Truck,
  ShieldCheck,
  Headphones,
  Package,
  Search,
  ShoppingCart,
  User,
  Heart,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import BannerImageUpload from "@/components/admin/BannerImageUpload";
import { IMAGE_SPECS } from "@/lib/admin/imageSpecs";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import type {
  HeaderSettingRecord,
  NavigationMenuItemRecord,
  NavigationMenuRecord,
} from "@/lib/server/navigation/navigationRepository";
import type { AdminCategory } from "@/types/admin";

type ActiveTab = "nav" | "utility" | "settings" | "preview";

interface ItemFormData {
  label: string;
  url: string;
  categoryId: string;
  icon: string;
  itemType: "link" | "dropdown" | "mega_menu";
  badgeText: string;
  isActive: boolean;
  visibleDesktop: boolean;
  visibleMobile: boolean;
  openInNewTab: boolean;
}

const EMPTY_ITEM_FORM: ItemFormData = {
  label: "",
  url: "",
  categoryId: "",
  icon: "",
  itemType: "link",
  badgeText: "",
  isActive: true,
  visibleDesktop: true,
  visibleMobile: true,
  openInNewTab: false,
};

function NavigationManagementContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("nav");
  const [editingItem, setEditingItem] = useState<{ id: string | null; menuId: string } | null>(
    null,
  );
  const [itemForm, setItemForm] = useState<ItemFormData>(EMPTY_ITEM_FORM);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<NavigationMenuItemRecord | null>(null);

  // Load navigation menus and settings
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-navigation"],
    queryFn: async () => {
      return adminFetchJson<{
        menus: NavigationMenuRecord[];
        settings: HeaderSettingRecord;
      }>("/api/admin/navigation");
    },
  });

  // Load categories for linking reference
  const { data: catData } = useQuery({
    queryKey: ["admin-categories-ref"],
    queryFn: async () => {
      return adminFetchJson<{ categories: AdminCategory[] }>("/api/admin/categories");
    },
    staleTime: 60_000,
  });

  const categories = catData?.categories ?? [];
  const menus = data?.menus ?? [];
  const settings = data?.settings;

  const mainMenu = menus.find((m) => m.handle === "main_nav") ?? menus[0];
  const utilityMenu = menus.find((m) => m.handle === "utility_bar") ?? menus[1];

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<HeaderSettingRecord>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  if (settings && !settingsLoaded) {
    setSettingsForm(settings);
    setSettingsLoaded(true);
  }

  // Mutation to save settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updated: Partial<HeaderSettingRecord>) => {
      await adminMutateJson("/api/admin/navigation/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation"] });
      alert("Header settings updated successfully!");
    },
  });

  // Mutation to save/create an item
  const saveItemMutation = useMutation({
    mutationFn: async () => {
      if (!editingItem) return;
      const payload = {
        menuId: editingItem.menuId,
        label: itemForm.label.trim(),
        url: itemForm.url.trim(),
        categoryId: itemForm.categoryId.trim() || null,
        icon: itemForm.icon.trim() || null,
        itemType: itemForm.itemType,
        badgeText: itemForm.badgeText.trim() || null,
        isActive: itemForm.isActive,
        visibleDesktop: itemForm.visibleDesktop,
        visibleMobile: itemForm.visibleMobile,
        openInNewTab: itemForm.openInNewTab,
      };

      if (editingItem.id) {
        await adminMutateJson(`/api/admin/navigation/items/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await adminMutateJson("/api/admin/navigation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      setEditingItem(null);
      setItemForm(EMPTY_ITEM_FORM);
      queryClient.invalidateQueries({ queryKey: ["admin-navigation"] });
    },
  });

  // Mutation to toggle active
  const toggleItemActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminMutateJson(`/api/admin/navigation/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation"] });
    },
  });

  // Mutation to reorder
  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      await adminMutateJson("/api/admin/navigation/items/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation"] });
    },
  });

  // Mutation to delete an item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminMutateJson(`/api/admin/navigation/items/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      setDeleteConfirmItem(null);
      queryClient.invalidateQueries({ queryKey: ["admin-navigation"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Failed to load navigation configuration."
        }
        onRetry={() => void refetch()}
      />
    );
  }

  function handleMove(items: NavigationMenuItemRecord[], index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const payload = reordered.map((item, idx) => ({
      id: item.id,
      sortOrder: idx,
    }));

    reorderMutation.mutate(payload);
  }

  function openEditModal(menuId: string, item?: NavigationMenuItemRecord) {
    if (item) {
      setEditingItem({ id: item.id, menuId });
      setItemForm({
        label: item.label,
        url: item.url,
        categoryId: item.categoryId ?? "",
        icon: item.icon ?? "",
        itemType: (item.itemType as ItemFormData["itemType"]) || "link",
        badgeText: item.badgeText ?? "",
        isActive: item.isActive,
        visibleDesktop: item.visibleDesktop,
        visibleMobile: item.visibleMobile,
        openInNewTab: item.openInNewTab,
      });
    } else {
      setEditingItem({ id: null, menuId });
      setItemForm(EMPTY_ITEM_FORM);
    }
  }

  const mainItems = mainMenu?.items ?? [];
  const utilityItems = utilityMenu?.items ?? [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header Description */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--admin-text)" }}>
          Header & Menu Management
        </h2>
        <p style={{ color: "var(--admin-text-muted)", fontSize: "0.875rem", marginTop: "0.35rem" }}>
          Independently control website header navigation, utility strips, search options, and
          mega-menus. Changes here never delete or modify categories or catalog data.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--admin-border)",
          marginBottom: "1.5rem",
        }}
      >
        <button
          type="button"
          className={`admin-btn ${activeTab === "nav" ? "admin-btn--primary" : "admin-btn--ghost"}`}
          onClick={() => setActiveTab("nav")}
        >
          Row 3: Primary Navigation ({mainItems.length})
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === "utility" ? "admin-btn--primary" : "admin-btn--ghost"}`}
          onClick={() => setActiveTab("utility")}
        >
          Row 1: Utility Bar ({utilityItems.length})
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === "settings" ? "admin-btn--primary" : "admin-btn--ghost"}`}
          onClick={() => setActiveTab("settings")}
        >
          Row 2: Header & Search Settings
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === "preview" ? "admin-btn--primary" : "admin-btn--ghost"}`}
          onClick={() => setActiveTab("preview")}
        >
          Header Live Preview
        </button>
      </div>

      {/* TAB 1: Primary Navigation */}
      {activeTab === "nav" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
                Primary Navigation Menu Links
              </h3>
              <small style={{ color: "var(--admin-text-muted)" }}>
                Order and configure items appearing on the main desktop navigation bar.
              </small>
            </div>
            {canWrite && mainMenu && (
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => openEditModal(mainMenu.id)}
              >
                <Plus size={16} /> Add Navigation Item
              </button>
            )}
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Order</th>
                  <th>Menu Label</th>
                  <th>URL / Destination</th>
                  <th>Type</th>
                  <th>Category Link</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mainItems.map((item, index) => {
                  const isFirst = index === 0;
                  const isLast = index === mainItems.length - 1;
                  const linkedCat = item.categoryId
                    ? categories.find((c) => c.id === item.categoryId || c.slug === item.categoryId)
                    : null;
                  const hasBrokenLink = item.categoryId && !linkedCat;

                  return (
                    <tr key={item.id} style={{ opacity: item.isActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: "flex", gap: "0.2rem" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            style={{ padding: "0.2rem 0.35rem" }}
                            disabled={isFirst || !canWrite || reorderMutation.isPending}
                            onClick={() => handleMove(mainItems, index, "up")}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            style={{ padding: "0.2rem 0.35rem" }}
                            disabled={isLast || !canWrite || reorderMutation.isPending}
                            onClick={() => handleMove(mainItems, index, "down")}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: "0.95rem" }}>{item.label}</strong>
                        {item.badgeText && (
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              background: "#ef4444",
                              color: "#fff",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              padding: "1px 5px",
                              borderRadius: 3,
                            }}
                          >
                            {item.badgeText}
                          </span>
                        )}
                        {item.openInNewTab && (
                          <ExternalLink
                            size={12}
                            style={{ marginLeft: "0.35rem", color: "var(--admin-text-muted)" }}
                          />
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: "0.8rem" }}>{item.url}</code>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge--neutral">{item.itemType}</span>
                      </td>
                      <td>
                        {item.categoryId ? (
                          hasBrokenLink ? (
                            <span
                              style={{
                                color: "#d97706",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: "0.8rem",
                              }}
                            >
                              <AlertTriangle size={14} /> Ref: {item.categoryId} (unlinked)
                            </span>
                          ) : (
                            <span
                              style={{
                                color: "#2563eb",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: "0.8rem",
                              }}
                            >
                              <CheckCircle2 size={14} /> {linkedCat?.name}
                            </span>
                          )
                        ) : (
                          <span style={{ color: "var(--admin-text-muted)", fontSize: "0.8rem" }}>
                            Direct link
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`admin-btn ${item.isActive ? "admin-btn--secondary" : "admin-btn--ghost"}`}
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                          disabled={!canWrite}
                          onClick={() =>
                            toggleItemActiveMutation.mutate({
                              id: item.id,
                              isActive: !item.isActive,
                            })
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          {canWrite && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              style={{ padding: "0.25rem 0.5rem" }}
                              onClick={() => openEditModal(mainMenu.id, item)}
                              title="Edit Menu Item"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              style={{ padding: "0.25rem 0.5rem" }}
                              onClick={() => setDeleteConfirmItem(item)}
                              title="Delete Menu Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Utility Bar */}
      {activeTab === "utility" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
                Top Utility & Announcement Bar
              </h3>
              <small style={{ color: "var(--admin-text-muted)" }}>
                Items shown in the slim deep-blue top strip above the main header (trust badges,
                links, support).
              </small>
            </div>
            {canWrite && utilityMenu && (
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => openEditModal(utilityMenu.id)}
              >
                <Plus size={16} /> Add Utility Item
              </button>
            )}
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Order</th>
                  <th>Icon</th>
                  <th>Item Text</th>
                  <th>Link (Optional)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilityItems.map((item, index) => {
                  const isFirst = index === 0;
                  const isLast = index === utilityItems.length - 1;

                  return (
                    <tr key={item.id} style={{ opacity: item.isActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: "flex", gap: "0.2rem" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            style={{ padding: "0.2rem 0.35rem" }}
                            disabled={isFirst || !canWrite || reorderMutation.isPending}
                            onClick={() => handleMove(utilityItems, index, "up")}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            style={{ padding: "0.2rem 0.35rem" }}
                            disabled={isLast || !canWrite || reorderMutation.isPending}
                            onClick={() => handleMove(utilityItems, index, "down")}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                          {item.icon || "None"}
                        </span>
                      </td>
                      <td>
                        <strong>{item.label}</strong>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.8rem" }}>{item.url || "None"}</code>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`admin-btn ${item.isActive ? "admin-btn--secondary" : "admin-btn--ghost"}`}
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                          disabled={!canWrite}
                          onClick={() =>
                            toggleItemActiveMutation.mutate({
                              id: item.id,
                              isActive: !item.isActive,
                            })
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          {canWrite && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              style={{ padding: "0.25rem 0.5rem" }}
                              onClick={() => openEditModal(utilityMenu.id, item)}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              style={{ padding: "0.25rem 0.5rem" }}
                              onClick={() => setDeleteConfirmItem(item)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Header & Search Settings */}
      {activeTab === "settings" && (
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h3
            style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: 0, marginBottom: "1.25rem" }}
          >
            Main Header Settings (Row 2)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <BannerImageUpload
              label="Header logo"
              spec={IMAGE_SPECS.headerLogo}
              value={settingsForm.logoAsset ?? ""}
              onChange={(url) => setSettingsForm({ ...settingsForm, logoAsset: url })}
            />

            <div className="admin-form-group">
              <label>Search Placeholder Text</label>
              <input
                className="admin-input"
                type="text"
                value={settingsForm.searchPlaceholder ?? ""}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, searchPlaceholder: e.target.value })
                }
                placeholder="Search for guitars, keyboards, microphones and more..."
              />
            </div>

            <div className="admin-form-group">
              <label>Free Shipping Announcement Text</label>
              <input
                className="admin-input"
                type="text"
                value={settingsForm.shippingAnnouncement ?? ""}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, shippingAnnouncement: e.target.value })
                }
                placeholder="Free Shipping on Orders Above ₹5,000*"
              />
            </div>

            <div className="admin-form-group">
              <label>Free Shipping Threshold (₹)</label>
              <input
                className="admin-input"
                type="number"
                value={settingsForm.shippingThreshold ?? 5000}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, shippingThreshold: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <h4
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              marginTop: "1.5rem",
              marginBottom: "0.75rem",
            }}
          >
            Visibility Toggles
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={settingsForm.utilityBarActive !== false}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, utilityBarActive: e.target.checked })
                }
              />
              <span>Enable Row 1 Utility Bar</span>
            </label>

            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={settingsForm.searchVisibility !== false}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, searchVisibility: e.target.checked })
                }
              />
              <span>Enable Product Search</span>
            </label>

            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={settingsForm.profileVisibility !== false}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, profileVisibility: e.target.checked })
                }
              />
              <span>Enable Account/Profile</span>
            </label>

            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={settingsForm.wishlistVisibility !== false}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, wishlistVisibility: e.target.checked })
                }
              />
              <span>Enable Wishlist</span>
            </label>

            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={settingsForm.cartVisibility !== false}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, cartVisibility: e.target.checked })
                }
              />
              <span>Enable Cart with Counter</span>
            </label>
          </div>

          {canWrite && (
            <div style={{ marginTop: "2rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={updateSettingsMutation.isPending}
                onClick={() => updateSettingsMutation.mutate(settingsForm)}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Header Settings"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Live Preview */}
      {activeTab === "preview" && (
        <div
          style={{
            border: "1px solid var(--admin-border)",
            borderRadius: 8,
            overflow: "hidden",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "#f1f5f9",
              borderBottom: "1px solid var(--admin-border)",
            }}
          >
            <strong>Storefront Header Preview</strong>
            <span
              style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", marginLeft: "0.5rem" }}
            >
              (Reflects current configured Row 1, Row 2, and Row 3)
            </span>
          </div>

          {/* Preview Row 1: Utility bar */}
          {settingsForm.utilityBarActive !== false && (
            <div
              style={{
                background: "#0b1a30",
                color: "#fff",
                padding: "0.4rem 1.5rem",
                fontSize: "0.775rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: "1.25rem" }}>
                {utilityItems
                  .filter((i) => i.isActive)
                  .slice(0, 3)
                  .map((i) => (
                    <span
                      key={i.id}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      {i.icon === "Truck" && <Truck size={12} color="#60a5fa" />}
                      {i.icon === "ShieldCheck" && <ShieldCheck size={12} color="#60a5fa" />}
                      {i.icon === "Headphones" && <Headphones size={12} color="#60a5fa" />}
                      {i.label}
                    </span>
                  ))}
              </div>
              <div style={{ display: "flex", gap: "1.25rem" }}>
                {utilityItems
                  .filter((i) => i.isActive)
                  .slice(3)
                  .map((i) => (
                    <span
                      key={i.id}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      {i.icon === "Package" && <Package size={12} color="#60a5fa" />}
                      {i.icon === "HelpCircle" && <HelpCircle size={12} color="#60a5fa" />}
                      {i.label}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Preview Row 2: Main header */}
          <div
            style={{
              background: "#ffffff",
              padding: "0.75rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: "1.4rem",
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Vibe <span style={{ color: "#2166ff" }}>Music</span>
            </div>

            <div
              style={{
                flex: 1,
                maxWidth: 550,
                display: "flex",
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: 8,
                padding: "0.4rem 0.75rem",
                alignItems: "center",
              }}
            >
              <Search size={16} color="#94a3b8" style={{ marginRight: "0.5rem" }} />
              <span style={{ color: "#94a3b8", fontSize: "0.85rem", flex: 1 }}>
                {settingsForm.searchPlaceholder || "Search for guitars, keyboards, microphones..."}
              </span>
              <button
                type="button"
                style={{
                  background: "#2166ff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "0.3rem 0.6rem",
                }}
              >
                <Search size={14} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1.25rem",
                alignItems: "center",
                color: "#1e293b",
                fontSize: "0.85rem",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <User size={18} /> Profile
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Heart size={18} /> Wishlist
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ShoppingCart size={18} /> Cart (0)
              </span>
            </div>
          </div>

          {/* Preview Row 3: Primary Navigation */}
          <div
            style={{
              background: "#ffffff",
              padding: "0.4rem 1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              style={{
                background: "#2166ff",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "0.45rem 0.9rem",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <LayoutGrid size={15} /> All Categories <ChevronDown size={14} />
            </button>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {mainItems
                .filter((i) => i.isActive)
                .map((item) => (
                  <span
                    key={item.id}
                    style={{
                      padding: "0.45rem 0.65rem",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#1e293b",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    {item.label}
                    {item.badgeText && (
                      <span
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: 3,
                        }}
                      >
                        {item.badgeText}
                      </span>
                    )}
                    {item.itemType === "dropdown" || item.itemType === "mega_menu" ? (
                      <ChevronDown size={11} color="#94a3b8" />
                    ) : null}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Item Modal */}
      {editingItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <h3>{editingItem.id ? "Edit Navigation Item" : "Add Navigation Item"}</h3>

            <div className="admin-form-group">
              <label>Menu Label *</label>
              <input
                className="admin-input"
                type="text"
                value={itemForm.label}
                onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                placeholder="e.g. Electric Guitars, Deals"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>URL / Destination *</label>
              <input
                className="admin-input"
                type="text"
                value={itemForm.url}
                onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                placeholder="e.g. /category/guitars or /deals"
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Optional Category Reference (Controlled Relationship)</label>
              <select
                className="admin-select"
                value={itemForm.categoryId}
                onChange={(e) => {
                  const selCat = categories.find((c) => c.id === e.target.value);
                  setItemForm({
                    ...itemForm,
                    categoryId: e.target.value,
                    url: itemForm.url || (selCat ? `/category/${selCat.slug}` : itemForm.url),
                    label: itemForm.label || (selCat ? selCat.name : itemForm.label),
                  });
                }}
              >
                <option value="">None (Custom Link)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>
              <small style={{ color: "var(--admin-text-muted)" }}>
                Note: Deleting this category will NOT delete this menu item.
              </small>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="admin-form-group">
                <label>Menu Type</label>
                <select
                  className="admin-select"
                  value={itemForm.itemType}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      itemType: e.target.value as ItemFormData["itemType"],
                    })
                  }
                >
                  <option value="link">Direct Link</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="mega_menu">Mega Menu</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Badge Label (Optional)</label>
                <input
                  className="admin-input"
                  type="text"
                  value={itemForm.badgeText}
                  onChange={(e) => setItemForm({ ...itemForm, badgeText: e.target.value })}
                  placeholder="e.g. Hot, New"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Icon Name (For Utility Bar)</label>
              <select
                className="admin-select"
                value={itemForm.icon}
                onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
              >
                <option value="">None</option>
                <option value="Truck">Truck (Shipping)</option>
                <option value="ShieldCheck">ShieldCheck (Genuine)</option>
                <option value="Headphones">Headphones (Support)</option>
                <option value="Package">Package (Orders)</option>
                <option value="HelpCircle">HelpCircle (FAQ)</option>
                <option value="Phone">Phone</option>
                <option value="Clock">Clock</option>
                <option value="Sparkles">Sparkles</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", margin: "1rem 0" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={itemForm.isActive}
                  onChange={(e) => setItemForm({ ...itemForm, isActive: e.target.checked })}
                />
                <span>Active</span>
              </label>

              <label
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={itemForm.openInNewTab}
                  onChange={(e) => setItemForm({ ...itemForm, openInNewTab: e.target.checked })}
                />
                <span>Open in New Tab</span>
              </label>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={
                  saveItemMutation.isPending || !itemForm.label.trim() || !itemForm.url.trim()
                }
                onClick={() => saveItemMutation.mutate()}
              >
                {saveItemMutation.isPending ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 450 }}>
            <h3 style={{ color: "#dc2626" }}>Delete Menu Item?</h3>
            <p>
              Are you sure you want to remove{" "}
              <strong>&ldquo;{deleteConfirmItem.label}&rdquo;</strong> from website navigation?
            </p>
            <div
              style={{
                background: "rgba(37, 99, 235, 0.08)",
                borderLeft: "3px solid #2563eb",
                padding: "0.75rem",
                borderRadius: 4,
                fontSize: "0.85rem",
                color: "var(--admin-text)",
                margin: "1rem 0",
              }}
            >
              <CheckCircle2
                size={16}
                style={{ color: "#2563eb", verticalAlign: "middle", marginRight: 4 }}
              />
              <strong>Safe Operation:</strong> Removing this menu item deletes only the navigation
              link. Any linked category, products, and taxonomy records will remain completely
              intact.
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setDeleteConfirmItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={deleteItemMutation.isPending}
                onClick={() => deleteItemMutation.mutate(deleteConfirmItem.id)}
              >
                {deleteItemMutation.isPending ? "Deleting..." : "Delete Menu Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminNavigationPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Header & Menu Management">
          <NavigationManagementContent
            canWrite={admin.role === "super_admin" || admin.permissions.includes("settings:write")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
