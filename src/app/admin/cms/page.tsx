"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState } from "@/components/admin/AdminUi";
import { slugify } from "@/lib/slug";
import type { ContentPage } from "@/data/contentPages";

const EMPTY_PAGE: ContentPage = {
  slug: "",
  title: "",
  eyebrow: "Customer Service",
  sections: [{ paragraphs: ["Write page content here."] }],
};

function CmsContent() {
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContentPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [hasDbOverride, setHasDbOverride] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cms-pages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cms/pages");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ pages: ContentPage[] }>;
    },
  });

  const pageQuery = useQuery({
    queryKey: ["admin-cms-page", selectedSlug],
    enabled: Boolean(selectedSlug) && !creating,
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/pages/${selectedSlug}`);
      if (!res.ok) throw new Error("Failed to load page");
      const json = (await res.json()) as {
        page: ContentPage;
        isSeeded?: boolean;
        hasDbOverride?: boolean;
      };
      setDraft(json.page);
      setIsSeeded(Boolean(json.isSeeded));
      setHasDbOverride(Boolean(json.hasDbOverride));
      return json.page;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (page: ContentPage) => {
      const url = creating
        ? "/api/admin/cms/pages"
        : `/api/admin/cms/pages/${page.slug}`;
      const res = await fetch(url, {
        method: creating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      return page;
    },
    onSuccess: (page) => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setActionError(null);
      setCreating(false);
      setSelectedSlug(page.slug);
      void queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-cms-page", page.slug] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/admin/cms/pages/${slug}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        revertedToSeed?: boolean;
      };
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      return json;
    },
    onSuccess: (result, slug) => {
      setActionError(null);
      if (result.revertedToSeed) {
        void queryClient.invalidateQueries({ queryKey: ["admin-cms-page", slug] });
        void queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSelectedSlug(null);
        setDraft(null);
        void queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
      }
    },
    onError: (err: Error) => setActionError(err.message),
  });

  if (isLoading) return <LoadingState />;

  const pages = data?.pages ?? [];

  return (
    <div className="admin-grid-2">
      <div className="admin-panel">
        <div className="admin-toolbar">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => {
              setCreating(true);
              setSelectedSlug(null);
              setDraft({ ...EMPTY_PAGE });
              setIsSeeded(false);
              setHasDbOverride(false);
              setActionError(null);
            }}
          >
            New page
          </button>
        </div>
        {pages.length === 0 ? (
          <EmptyState message="No CMS pages found." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr
                    key={page.slug}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedSlug === page.slug ? "var(--admin-surface-2)" : undefined,
                    }}
                    onClick={() => {
                      setCreating(false);
                      setSelectedSlug(page.slug);
                      setActionError(null);
                    }}
                  >
                    <td>{page.title}</td>
                    <td>{page.slug}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">
            {creating ? "Create page" : "Edit page"}
          </h2>
        </div>
        <div className="admin-panel__body">
          {actionError ? (
            <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
              <p className="admin-error__message">{actionError}</p>
            </div>
          ) : null}
          {(!creating && (!selectedSlug || pageQuery.isLoading || !draft)) ||
          (creating && !draft) ? (
            <EmptyState message="Select a page to edit, or create a new one." />
          ) : draft ? (
            <>
              <div className="admin-form-group">
                <label>Title</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={draft.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setDraft({
                      ...draft,
                      title,
                      slug: creating ? slugify(title) : draft.slug,
                    });
                  }}
                />
              </div>
              <div className="admin-form-group">
                <label>Slug</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={draft.slug}
                  disabled={!creating}
                  onChange={(e) =>
                    setDraft({ ...draft, slug: slugify(e.target.value) })
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Eyebrow</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={draft.eyebrow}
                  onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })}
                />
              </div>
              {draft.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="admin-form-group admin-form-grid--full">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <label style={{ margin: 0 }}>Section {sectionIndex + 1}</label>
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      onClick={() => {
                        const sections = draft.sections.filter((_, i) => i !== sectionIndex);
                        setDraft({
                          ...draft,
                          sections:
                            sections.length > 0
                              ? sections
                              : [{ paragraphs: ["Write page content here."] }],
                        });
                      }}
                    >
                      Remove section
                    </button>
                  </div>
                  <input
                    className="admin-input"
                    style={{ width: "100%", marginBottom: "0.5rem" }}
                    placeholder="Heading (optional)"
                    value={section.heading ?? ""}
                    onChange={(e) => {
                      const sections = [...draft.sections];
                      sections[sectionIndex] = {
                        ...section,
                        heading: e.target.value || undefined,
                      };
                      setDraft({ ...draft, sections });
                    }}
                  />
                  <textarea
                    className="admin-textarea"
                    value={section.paragraphs.join("\n\n")}
                    onChange={(e) => {
                      const sections = [...draft.sections];
                      sections[sectionIndex] = {
                        ...section,
                        paragraphs: e.target.value
                          .split(/\n{2,}/)
                          .map((item) => item.trim())
                          .filter(Boolean),
                      };
                      setDraft({ ...draft, sections });
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ marginBottom: "1rem" }}
                onClick={() =>
                  setDraft({
                    ...draft,
                    sections: [
                      ...draft.sections,
                      { paragraphs: ["New section content."] },
                    ],
                  })
                }
              >
                Add section
              </button>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={saveMutation.isPending}
                  onClick={() => draft && saveMutation.mutate(draft)}
                >
                  {saveMutation.isPending
                    ? "Saving…"
                    : creating
                      ? "Create page"
                      : "Save page"}
                </button>
                {!creating && selectedSlug ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      const message = isSeeded
                        ? hasDbOverride
                          ? "Reset this page to the seeded default content?"
                          : "This seeded page has no DB override to delete."
                        : `Permanently delete “${selectedSlug}”?`;
                      if (isSeeded && !hasDbOverride) {
                        setActionError("Seeded page has no override to delete.");
                        return;
                      }
                      if (window.confirm(message)) {
                        deleteMutation.mutate(selectedSlug);
                      }
                    }}
                  >
                    {isSeeded ? "Reset to default" : "Delete page"}
                  </button>
                ) : null}
                {creating ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    onClick={() => {
                      setCreating(false);
                      setDraft(null);
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
                {saved ? (
                  <span style={{ color: "var(--admin-success)", alignSelf: "center" }}>
                    Saved
                  </span>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AdminCmsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="CMS pages">
          {admin.permissions.includes("settings:write") ? (
            <CmsContent />
          ) : (
            <EmptyState message="Insufficient permissions." />
          )}
        </AdminShell>
      )}
    </AdminGuard>
  );
}
