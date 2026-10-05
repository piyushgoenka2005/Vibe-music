"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import BannerImageUpload from "@/components/admin/BannerImageUpload";
import {
  AdminCursorPagination,
  EmptyState,
  LoadingState,
  StatusBadge,
} from "@/components/admin/AdminUi";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import type { HomepageBanner } from "@/types/banner";

const QUERY_KEY = ["admin-banners"] as const;

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  image: "",
  mobileImage: "",
  ctaText: "",
  ctaLink: "/search",
  startDate: "",
  endDate: "",
  priority: 0,
  status: "active" as "active" | "inactive",
};

function toDatetimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function scheduleLabel(banner: HomepageBanner): string {
  if (!banner.startDate && !banner.endDate) return "Always on";
  const start = banner.startDate
    ? new Date(banner.startDate).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Now";
  const end = banner.endDate
    ? new Date(banner.endDate).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No end";
  return `${start} → ${end}`;
}

function BannersContent({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } = useAdminCursorPagination();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [...QUERY_KEY, cursor],
    queryFn: async () => {
      const url = `/api/admin/banners?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      return adminFetchJson<{
        banners: HomepageBanner[];
        hasMore: boolean;
        nextCursor?: string;
      }>(url);
    },
  });

  const banners = useMemo(
    () => [...(data?.banners ?? [])].sort((a, b) => a.priority - b.priority),
    [data?.banners],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        title: form.title || "",
        subtitle: form.subtitle || undefined,
        mobileImage: form.mobileImage || undefined,
        ctaText: form.ctaText || "",
        ctaLink: form.ctaLink || "/search",
        startDate: fromDatetimeLocal(form.startDate),
        endDate: fromDatetimeLocal(form.endDate),
        priority: Number(form.priority) || 0,
      };
      const url = editId ? `/api/admin/banners/${editId}` : "/api/admin/banners";
      await adminMutateJson(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      setFormError(null);
      reset();
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminMutateJson(`/api/admin/banners/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      reset();
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (banner: HomepageBanner) => {
      await adminMutateJson(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: banner.status === "active" ? "inactive" : "active",
        }),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await adminMutateJson("/api/admin/banners/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(banner: HomepageBanner) {
    setEditId(banner.id);
    setShowForm(true);
    setFormError(null);
    setForm({
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      image: banner.image,
      mobileImage: banner.mobileImage ?? "",
      ctaText: banner.ctaText ?? "",
      ctaLink: banner.ctaLink ?? "/search",
      startDate: toDatetimeLocal(banner.startDate),
      endDate: toDatetimeLocal(banner.endDate),
      priority: banner.priority,
      status: banner.status,
    });
  }

  function moveBanner(id: string, direction: -1 | 1) {
    const index = banners.findIndex((b) => b.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= banners.length) return;
    const next = [...banners];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    reorderMutation.mutate(next.map((b) => b.id));
  }

  if (isLoading) return <LoadingState message="Loading banners…" />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load banners."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      <div className="admin-toolbar">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn admin-btn--secondary"
        >
          Preview homepage
        </a>
        <Link
          href="/admin/homepage"
          className="admin-btn admin-btn--secondary"
          title="Manage Landing Page Story Banners (A+)"
        >
          Featured Story Banners →
        </Link>
        {canWrite ? (
          <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate}>
            <Plus size={16} />
            Add Banner
          </button>
        ) : null}
      </div>

      {showForm ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">{editId ? "Edit Banner" : "New Banner"}</h2>
          </div>
          <div className="admin-panel__body">
            {formError ? (
              <p style={{ color: "#c41e3a", marginBottom: 12 }} role="alert">
                {formError}
              </p>
            ) : null}
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Title (Optional)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Optional — leave blank if graphic already has text"
                />
              </div>
              <div className="admin-form-group">
                <label>Subtitle (Optional)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Optional — leave blank if graphic already has text"
                />
              </div>
              <div className="admin-form-group">
                <label>CTA Button Text (Optional)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  placeholder="e.g. Shop Now (leave blank to hide button)"
                />
              </div>
              <div className="admin-form-group">
                <label>CTA Link (Optional)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.ctaLink}
                  onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                  placeholder="/category/guitars or /deals"
                />
              </div>
              <div className="admin-form-group">
                <label>Start Date</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>End Date</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Priority</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })}
                />
                <p className="admin-form-hint" style={{ marginTop: "0.35rem" }}>
                  Lower numbers appear first. You can also reorder banners in the table.
                </p>
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select
                  className="admin-select"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <BannerImageUpload
                label="Desktop Image"
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
              />
              <BannerImageUpload
                label="Mobile Image (optional)"
                value={form.mobileImage}
                onChange={(url) => setForm({ ...form, mobileImage: url })}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={saveMutation.isPending || !form.image}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving…" : "Save Banner"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm(EMPTY_FORM);
                  setFormError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-panel">
        {banners.length === 0 ? (
          <EmptyState message="No homepage banners yet. Create your first banner to replace the static hero." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Title</th>
                  <th>Schedule</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner, index) => (
                  <tr key={banner.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={banner.image}
                        alt={banner.title || "Homepage Banner"}
                        style={{
                          width: 96,
                          height: 48,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    </td>
                    <td>
                      <strong>
                        {banner.title?.trim() || (
                          <span
                            style={{
                              color: "var(--admin-muted)",
                              fontStyle: "italic",
                              fontWeight: 400,
                            }}
                          >
                            Image only (No text overlay)
                          </span>
                        )}
                      </strong>
                      {banner.subtitle ? (
                        <div style={{ fontSize: 12, color: "var(--admin-muted)" }}>
                          {banner.subtitle}
                        </div>
                      ) : null}
                      {banner.ctaText ? (
                        <span
                          className="admin-badge"
                          style={{ marginTop: 4, display: "inline-block" }}
                        >
                          {banner.ctaText}
                        </span>
                      ) : null}
                    </td>
                    <td style={{ fontSize: 13 }}>{scheduleLabel(banner)}</td>
                    <td>{banner.priority}</td>
                    <td>
                      <StatusBadge status={banner.status === "active" ? "active" : "archived"} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {canWrite ? (
                          <>
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              aria-label="Move up"
                              disabled={index === 0 || reorderMutation.isPending}
                              onClick={() => moveBanner(banner.id, -1)}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              aria-label="Move down"
                              disabled={index === banners.length - 1 || reorderMutation.isPending}
                              onClick={() => moveBanner(banner.id, 1)}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              onClick={() => openEdit(banner)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              disabled={toggleMutation.isPending}
                              onClick={() => toggleMutation.mutate(banner)}
                            >
                              {banner.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                          </>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger"
                            onClick={() => deleteMutation.mutate(banner.id)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminCursorPagination
          pageIndex={pageIndex}
          canGoPrev={canGoPrev}
          hasMore={data?.hasMore ?? false}
          isFetching={isFetching}
          onPrev={goPrev}
          onNext={() => goNext(data?.nextCursor)}
        />
      </div>
    </>
  );
}

export default function AdminBannersPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Homepage Banners">
          <p className="admin-page-lead">
            Hero carousel at the top of the storefront. Changes publish live within ~30 seconds —
            keep the homepage open to preview without reloading.
          </p>
          <BannersContent
            canWrite={admin.permissions.includes("banners:write")}
            canDelete={admin.permissions.includes("banners:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
