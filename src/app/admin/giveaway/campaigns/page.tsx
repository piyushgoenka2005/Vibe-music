"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { EmptyState, LoadingState, StatusBadge } from "@/components/admin/AdminUi";
import { slugify } from "@/lib/slug";
import type { AdminSession } from "@/types/admin";
import type { GiveawayCampaign, GiveawayCampaignStatus, GiveawayEntry } from "@/types/giveaway";

type CampaignForm = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  status: GiveawayCampaignStatus;
  prizeTitle: string;
  prizeDescription: string;
  prizeImageUrl: string;
  productSlug: string;
  prizeValue: string;
  winnerCount: number;
  maxEntries: string;
  startsAt: string;
  endsAt: string;
  drawAt: string;
  requireLogin: boolean;
  requireEmailVerification: boolean;
  referralBonusEntries: number;
  socialBonusEntries: number;
  featured: boolean;
  termsHtml: string;
};

const EMPTY_FORM: CampaignForm = {
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  status: "draft",
  prizeTitle: "",
  prizeDescription: "",
  prizeImageUrl: "",
  productSlug: "",
  prizeValue: "",
  winnerCount: 1,
  maxEntries: "",
  startsAt: "",
  endsAt: "",
  drawAt: "",
  requireLogin: false,
  requireEmailVerification: true,
  referralBonusEntries: 1,
  socialBonusEntries: 1,
  featured: false,
  termsHtml: "",
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(local: string): string {
  return new Date(local).toISOString();
}

function campaignToForm(c: GiveawayCampaign): CampaignForm {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle ?? "",
    description: c.description ?? "",
    status: c.status,
    prizeTitle: c.prizeTitle,
    prizeDescription: c.prizeDescription ?? "",
    prizeImageUrl: c.prizeImageUrl ?? "",
    productSlug: c.productSlug ?? "",
    prizeValue: c.prizeValue != null ? String(c.prizeValue) : "",
    winnerCount: c.winnerCount ?? 1,
    maxEntries: c.maxEntries != null ? String(c.maxEntries) : "",
    startsAt: toLocalInput(c.startsAt),
    endsAt: toLocalInput(c.endsAt),
    drawAt: toLocalInput(c.drawAt),
    requireLogin: c.requireLogin,
    requireEmailVerification: c.requireEmailVerification,
    referralBonusEntries: c.referralBonusEntries ?? 0,
    socialBonusEntries: c.socialBonusEntries ?? 0,
    featured: c.featured,
    termsHtml: c.termsHtml ?? "",
  };
}

function formToPayload(form: CampaignForm) {
  return {
    id: form.id,
    slug: form.slug || slugify(form.title),
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || undefined,
    description: form.description.trim() || undefined,
    status: form.status,
    prizeTitle: form.prizeTitle.trim(),
    prizeDescription: form.prizeDescription.trim() || undefined,
    prizeImageUrl: form.prizeImageUrl.trim(),
    productSlug: form.productSlug.trim() || undefined,
    prizeValue: form.prizeValue ? Number(form.prizeValue) : undefined,
    winnerCount: form.winnerCount,
    maxEntries: form.maxEntries ? Number(form.maxEntries) : null,
    startsAt: toIso(form.startsAt),
    endsAt: toIso(form.endsAt),
    drawAt: form.drawAt ? toIso(form.drawAt) : null,
    requireLogin: form.requireLogin,
    requireEmailVerification: form.requireEmailVerification,
    referralBonusEntries: form.referralBonusEntries,
    socialBonusEntries: form.socialBonusEntries,
    featured: form.featured,
    termsHtml: form.termsHtml.trim() || undefined,
  };
}

function CampaignEntriesPanel({ campaignId }: { campaignId: string }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-giveaway-entries", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/giveaway/campaigns/${campaignId}/entries`);
      if (!res.ok) throw new Error("Failed to load entries");
      return res.json() as Promise<{ entries: GiveawayEntry[] }>;
    },
  });

  if (isLoading) return <LoadingState message="Loading entries…" />;
  if (error) {
    return (
      <ErrorState
        message="Unable to load campaign entries."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const entries = data?.entries ?? [];
  if (entries.length === 0) {
    return <EmptyState message="No entries yet for this campaign." />;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Entry #</th>
            <th>Name</th>
            <th>Email</th>
            <th>Total</th>
            <th>Status</th>
            <th>Verified</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.entryNumber}</td>
              <td>{entry.customerName}</td>
              <td>{entry.email}</td>
              <td>{entry.totalEntries}</td>
              <td>
                <StatusBadge status={entry.status} />
              </td>
              <td>{entry.emailVerified ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CampaignsAdmin({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("id");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [entriesCampaignId, setEntriesCampaignId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-giveaway-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/admin/giveaway/campaigns");
      if (!res.ok) throw new Error("Failed to load campaigns");
      return res.json() as Promise<{ campaigns: GiveawayCampaign[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form);
      if (!payload.title || !payload.prizeTitle || !payload.startsAt || !payload.endsAt) {
        throw new Error("Title, prize, start, and end are required");
      }
      const url = form.id
        ? `/api/admin/giveaway/campaigns/${form.id}`
        : "/api/admin/giveaway/campaigns";
      const res = await fetch(url, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
    },
    onSuccess: () => {
      setShowForm(false);
      setForm(EMPTY_FORM);
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-giveaway-campaigns"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/giveaway/campaigns/${id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
    },
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-giveaway-campaigns"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const drawMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/giveaway/campaigns/${id}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Draw failed");
    },
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-giveaway-campaigns"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const announceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/giveaway/campaigns/${id}/announce`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Announce failed");
    },
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-giveaway-campaigns"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const campaigns = useMemo(() => data?.campaigns ?? [], [data?.campaigns]);

  useEffect(() => {
    if (!deepLinkId || !campaigns.length) return;
    const match = campaigns.find((c) => c.id === deepLinkId);
    if (!match) return;
    setEntriesCampaignId(match.id);
    if (canWrite) {
      setForm(campaignToForm(match));
      setShowForm(true);
    }
  }, [deepLinkId, campaigns, canWrite]);

  if (isLoading) return <LoadingState message="Loading campaigns…" />;
  if (error) {
    return (
      <ErrorState
        message="Unable to load giveaway campaigns."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      {canWrite ? (
        <div className="admin-toolbar">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowForm(true);
              setActionError(null);
            }}
          >
            New campaign
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
          <p className="admin-error__message">{actionError}</p>
        </div>
      ) : null}

      {showForm ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">
              {form.id ? "Edit campaign" : "Create campaign"}
            </h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Title</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title,
                      slug: prev.id ? prev.slug : slugify(title),
                    }));
                  }}
                />
              </div>
              <div className="admin-form-group">
                <label>Slug</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                />
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select
                  className="admin-select"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as GiveawayCampaignStatus })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                  <option value="drawn">Drawn</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Prize title</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.prizeTitle}
                  onChange={(e) => setForm({ ...form, prizeTitle: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Starts at</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Ends at</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Draw at (optional)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="datetime-local"
                  value={form.drawAt}
                  onChange={(e) => setForm({ ...form, drawAt: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Winner count</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={1}
                  max={20}
                  value={form.winnerCount}
                  onChange={(e) =>
                    setForm({ ...form, winnerCount: Number(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Max entries (optional)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={1}
                  value={form.maxEntries}
                  onChange={(e) => setForm({ ...form, maxEntries: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Prize value (₹)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  value={form.prizeValue}
                  onChange={(e) => setForm({ ...form, prizeValue: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Product slug (optional)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.productSlug}
                  onChange={(e) => setForm({ ...form, productSlug: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Prize image URL</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.prizeImageUrl}
                  onChange={(e) => setForm({ ...form, prizeImageUrl: e.target.value })}
                />
              </div>
              <div className="admin-form-group admin-form-grid--full">
                <label>Subtitle</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>
              <div className="admin-form-group admin-form-grid--full">
                <label>Description</label>
                <textarea
                  className="admin-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="admin-form-group admin-form-grid--full">
                <label>Prize description</label>
                <textarea
                  className="admin-textarea"
                  value={form.prizeDescription}
                  onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })}
                />
              </div>
              <div className="admin-form-group admin-form-grid--full">
                <label>Terms (HTML)</label>
                <textarea
                  className="admin-textarea"
                  value={form.termsHtml}
                  onChange={(e) => setForm({ ...form, termsHtml: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.requireLogin}
                    onChange={(e) => setForm({ ...form, requireLogin: e.target.checked })}
                  />{" "}
                  Require login
                </label>
              </div>
              <div className="admin-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.requireEmailVerification}
                    onChange={(e) =>
                      setForm({ ...form, requireEmailVerification: e.target.checked })
                    }
                  />{" "}
                  Require email verification
                </label>
              </div>
              <div className="admin-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />{" "}
                  Featured
                </label>
              </div>
              <div className="admin-form-group">
                <label>Referral bonus entries</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  max={10}
                  value={form.referralBonusEntries}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      referralBonusEntries: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Social bonus entries</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  max={10}
                  value={form.socialBonusEntries}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialBonusEntries: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving…" : form.id ? "Update" : "Create"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-panel">
        {campaigns.length === 0 ? (
          <EmptyState message="No giveaway campaigns." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Entries</th>
                  <th>Ends</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/giveaway/${c.slug}`}>{c.title}</Link>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>{c.entryCount ?? 0}</td>
                    <td>{new Date(c.endsAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() =>
                          setEntriesCampaignId((prev) => (prev === c.id ? null : c.id))
                        }
                      >
                        {entriesCampaignId === c.id ? "Hide entries" : "Entries"}
                      </button>
                      <a
                        href={`/api/admin/giveaway/campaigns/${c.id}/export`}
                        className="admin-btn admin-btn--ghost"
                      >
                        Export
                      </a>
                      {canWrite ? (
                        <>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => {
                              setForm(campaignToForm(c));
                              setShowForm(true);
                              setActionError(null);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => drawMutation.mutate(c.id)}
                          >
                            Draw
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            disabled={c.winnersAnnounced}
                            onClick={() => announceMutation.mutate(c.id)}
                          >
                            Announce
                          </button>
                        </>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete campaign “${c.title}”? This cannot be undone.`
                              )
                            ) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {entriesCampaignId ? (
        <div className="admin-panel" style={{ marginTop: "1rem" }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Campaign entries</h2>
          </div>
          <div className="admin-panel__body">
            <CampaignEntriesPanel campaignId={entriesCampaignId} />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function AdminGiveawayCampaignsPage() {
  return (
    <AdminGuard>
      {(admin: AdminSession) => (
        <AdminShell admin={admin} title="Giveaway campaigns">
          <Suspense fallback={<LoadingState />}>
            <CampaignsAdmin
              canWrite={admin.permissions.includes("giveaways:write")}
              canDelete={admin.permissions.includes("giveaways:delete")}
            />
          </Suspense>
        </AdminShell>
      )}
    </AdminGuard>
  );
}
