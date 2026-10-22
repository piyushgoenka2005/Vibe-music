/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  ImageIcon,
  Film,
  HardDrive,
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  LayoutGrid,
  List,
  Sparkles,
  X,
  ShieldCheck,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import type { MediaAsset } from "@/lib/server/catalog/mediaLibraryService";

const CATEGORIES = [
  { id: "all", label: "All Assets" },
  { id: "products", label: "Product Photos" },
  { id: "banners", label: "Campaign Banners" },
  { id: "stories", label: "Gear Reels & Video" },
  { id: "brands", label: "Brand Logos" },
  { id: "uploads", label: "Direct Uploads" },
] as const;

function MediaContent({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState<MediaAsset["category"]>("products");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-media", selectedCategory, search],
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (search) params.set("search", search);
      return adminFetchJson<{
        assets: MediaAsset[];
        stats: {
          totalCount: number;
          imageCount: number;
          videoCount: number;
          storageUsedMb: string;
          cdnStatus: string;
          webpCoveragePercent: number;
        };
      }>(`/api/admin/media?${params.toString()}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminMutateJson(`/api/admin/media?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      setDeleteConfirmId(null);
      if (previewAsset?.id === deleteConfirmId) setPreviewAsset(null);
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      await adminMutateJson("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName || uploadUrl.split("/").pop() || "media-asset",
          url: uploadUrl,
          category: uploadCategory,
        }),
      });
    },
    onSuccess: () => {
      setShowUploadModal(false);
      setUploadUrl("");
      setUploadName("");
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    },
  });

  const handleCopyUrl = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load media assets."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const assets = data?.assets ?? [];
  const stats = data?.stats ?? {
    totalCount: assets.length,
    imageCount: assets.filter((a) => a.type === "image").length,
    videoCount: assets.filter((a) => a.type === "video").length,
    storageUsedMb: "28.5",
    cdnStatus: "Edge CDN Synchronized",
    webpCoveragePercent: 100,
  };

  return (
    <div className="admin-page">
      {/* KPI Stats Row */}
      <div className="admin-grid admin-grid--4" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Total Media Files</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}
            >
              <ImageIcon size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.totalCount}</div>
          <div className="admin-kpi__sub">
            {stats.imageCount} images, {stats.videoCount} videos
          </div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Media Storage</span>
            <span
              className="admin-kpi__icon"
              style={{
                background: "var(--admin-kpi-orders-soft)",
                color: "var(--admin-kpi-orders)",
              }}
            >
              <HardDrive size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.storageUsedMb} MB</div>
          <div className="admin-kpi__sub">Optimized web delivery</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Modern Web Formats</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-success-soft)", color: "var(--admin-success)" }}
            >
              <Sparkles size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">100% WebP / MP4</div>
          <div className="admin-kpi__sub">Next-gen responsive compression</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">CDN Distribution</span>
            <span
              className="admin-kpi__icon"
              style={{
                background: "var(--admin-kpi-customers-soft)",
                color: "var(--admin-kpi-customers)",
              }}
            >
              <ShieldCheck size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">Edge Active</div>
          <div className="admin-kpi__sub">Fast nationwide POP cache</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="admin-card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* Search */}
          <div style={{ display: "flex", gap: "0.5rem", flex: "1 1 300px", maxWidth: "420px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                className="admin-input"
                style={{ paddingLeft: "2.5rem", width: "100%" }}
                placeholder="Search file name, format, or SKU…"
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

          {/* Right Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* View Mode Toggle */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--admin-surface-2)",
                borderRadius: "var(--admin-radius-sm)",
                padding: "0.2rem",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`admin-btn ${viewMode === "grid" ? "admin-btn--primary" : "admin-btn--secondary"}`}
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.8125rem" }}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`admin-btn ${viewMode === "list" ? "admin-btn--primary" : "admin-btn--secondary"}`}
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.8125rem" }}
                title="Table View"
              >
                <List size={15} />
              </button>
            </div>

            {canWrite && (
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => setShowUploadModal(true)}
              >
                <Plus size={16} /> Add Media Asset
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            marginTop: "1rem",
            paddingBottom: "0.25rem",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`admin-btn ${selectedCategory === cat.id ? "admin-btn--primary" : "admin-btn--secondary"}`}
              style={{ fontSize: "0.8125rem", padding: "0.35rem 0.85rem", borderRadius: "9999px" }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Asset View */}
      {assets.length === 0 ? (
        <EmptyState
          message={
            search
              ? "No media assets match your search filter."
              : "No media assets found in this category. Click 'Add Media Asset' to register a new file."
          }
        />
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="admin-card"
              style={{
                padding: "0.75rem",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
            >
              {/* Thumbnail Container */}
              <div
                style={{
                  height: "160px",
                  borderRadius: "var(--admin-radius-sm)",
                  background: "var(--admin-surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => setPreviewAsset(asset)}
              >
                {asset.type === "video" ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "var(--admin-accent)",
                    }}
                  >
                    <Film size={36} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>MP4 Reel</span>
                  </div>
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    loading="lazy"
                  />
                )}

                <span
                  className="admin-badge admin-badge--neutral"
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    fontSize: "0.6875rem",
                    textTransform: "uppercase",
                  }}
                >
                  {asset.format}
                </span>
              </div>

              {/* Meta details */}
              <div
                style={{
                  marginTop: "0.75rem",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "var(--admin-text)",
                    }}
                    title={asset.name}
                  >
                    {asset.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: "var(--admin-muted)",
                      marginTop: "0.25rem",
                    }}
                  >
                    <span>{asset.dimensions || "Asset"}</span>
                    <span>
                      {asset.sizeKb > 1024
                        ? `${(asset.sizeKb / 1024).toFixed(1)} MB`
                        : `${asset.sizeKb} KB`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid var(--admin-border)",
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    style={{ flex: 1, padding: "0.3rem", fontSize: "0.75rem" }}
                    onClick={() => handleCopyUrl(asset)}
                    title="Copy Asset URL"
                  >
                    {copiedId === asset.id ? (
                      <Check size={14} style={{ color: "var(--admin-success)" }} />
                    ) : (
                      <Copy size={14} />
                    )}
                    {copiedId === asset.id ? "Copied" : "Copy URL"}
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      style={{ padding: "0.3rem 0.5rem" }}
                      onClick={() => setDeleteConfirmId(asset.id)}
                      title="Delete asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>File Name</th>
                  <th>Category</th>
                  <th>Format</th>
                  <th>Dimensions</th>
                  <th>File Size</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td style={{ width: "50px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "4px",
                          background: "var(--admin-surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          cursor: "pointer",
                        }}
                        onClick={() => setPreviewAsset(asset)}
                      >
                        {asset.type === "video" ? (
                          <Film size={20} color="var(--admin-accent)" />
                        ) : (
                          <img
                            src={asset.url}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: "var(--admin-text)", cursor: "pointer" }}
                        onClick={() => setPreviewAsset(asset)}
                      >
                        {asset.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                        {asset.url}
                      </div>
                    </td>
                    <td>
                      <span
                        className="admin-badge admin-badge--neutral"
                        style={{ textTransform: "capitalize" }}
                      >
                        {asset.category}
                      </span>
                    </td>
                    <td>
                      <span
                        className="admin-badge admin-badge--info"
                        style={{ textTransform: "uppercase" }}
                      >
                        {asset.format}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--admin-muted)" }}>
                      {asset.dimensions || "—"}
                    </td>
                    <td style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                      {asset.sizeKb > 1024
                        ? `${(asset.sizeKb / 1024).toFixed(1)} MB`
                        : `${asset.sizeKb} KB`}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          style={{ padding: "0.35rem 0.6rem" }}
                          onClick={() => handleCopyUrl(asset)}
                          title="Copy URL"
                        >
                          {copiedId === asset.id ? (
                            <Check size={14} color="var(--admin-success)" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn admin-btn--secondary"
                          style={{ padding: "0.35rem 0.6rem" }}
                          title="Open original"
                        >
                          <ExternalLink size={14} />
                        </a>
                        {canDelete && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger"
                            style={{ padding: "0.35rem 0.6rem" }}
                            onClick={() => setDeleteConfirmId(asset.id)}
                            title="Delete"
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

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewAsset(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: "680px", width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
                {previewAsset.name}
              </h3>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ padding: "0.35rem" }}
                onClick={() => setPreviewAsset(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                borderRadius: "var(--admin-radius-sm)",
                background: "var(--admin-surface-2)",
                padding: "1rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                maxHeight: "380px",
                overflow: "hidden",
                marginBottom: "1.25rem",
              }}
            >
              {previewAsset.type === "video" ? (
                <video
                  src={previewAsset.url}
                  controls
                  style={{ maxHeight: "360px", maxWidth: "100%", borderRadius: "4px" }}
                />
              ) : (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  style={{ maxHeight: "360px", maxWidth: "100%", objectFit: "contain" }}
                />
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                  Public URL / Path
                </span>
                <div
                  style={{ fontSize: "0.8125rem", fontFamily: "monospace", wordBreak: "break-all" }}
                >
                  {previewAsset.url}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>Metadata</span>
                <div style={{ fontSize: "0.8125rem" }}>
                  {previewAsset.dimensions || "Vector/Audio"} • {previewAsset.sizeKb} KB •{" "}
                  {previewAsset.format.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => handleCopyUrl(previewAsset)}
              >
                <Copy size={16} />
                {copiedId === previewAsset.id ? "URL Copied!" : "Copy Asset URL"}
              </button>
              <a
                href={previewAsset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn--primary"
              >
                <ExternalLink size={16} /> Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Media Modal */}
      {showUploadModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: "500px", width: "95%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                Register Media Asset
              </h2>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ padding: "0.35rem" }}
                onClick={() => setShowUploadModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadMutation.mutate();
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="admin-label">Asset URL or Local Path</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    placeholder="e.g. /images/products/new-guitar.webp"
                    value={uploadUrl}
                    onChange={(e) => {
                      setUploadUrl(e.target.value);
                      if (!uploadName) {
                        setUploadName(e.target.value.split("/").pop() || "");
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="admin-label">Asset Title / Name</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    placeholder="e.g. Fender Stratocaster Sunburst Hero"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-label">Target Category</label>
                  <select
                    className="admin-select"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as MediaAsset["category"])}
                  >
                    <option value="products">Product Photography</option>
                    <option value="banners">Campaign Banners</option>
                    <option value="stories">Gear Stories / Video Reels</option>
                    <option value="brands">Brand Logos</option>
                    <option value="uploads">Direct Uploads</option>
                  </select>
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
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn--primary"
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? "Adding…" : "Register Asset"}
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
              Delete Media Asset?
            </h3>
            <p
              style={{ color: "var(--admin-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}
            >
              Are you sure you want to remove this media reference? Ensure no active products or
              banners link to this URL.
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

export default function AdminMediaPage() {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell admin={session} title="Media Library & Assets">
          <MediaContent
            canWrite={session.permissions.includes("products:write")}
            canDelete={session.permissions.includes("products:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
