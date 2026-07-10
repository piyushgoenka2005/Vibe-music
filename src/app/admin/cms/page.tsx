"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState } from "@/components/admin/AdminUi";
import type { ContentPage } from "@/data/contentPages";

function CmsContent() {
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContentPage | null>(null);
  const [saved, setSaved] = useState(false);

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
    enabled: Boolean(selectedSlug),
    queryFn: async () => {
      const res = await fetch(`/api/admin/cms/pages/${selectedSlug}`);
      if (!res.ok) throw new Error("Failed to load page");
      const json = await res.json() as { page: ContentPage };
      setDraft(json.page);
      return json.page;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (page: ContentPage) => {
      const res = await fetch(`/api/admin/cms/pages/${page.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    },
  });

  if (isLoading) return <LoadingState />;

  const pages = data?.pages ?? [];

  return (
    <div className="admin-grid-2">
      <div className="admin-panel">
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
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedSlug(page.slug)}
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
          <h2 className="admin-panel__title">Edit page</h2>
        </div>
        <div className="admin-panel__body">
          {!selectedSlug || pageQuery.isLoading || !draft ? (
            <EmptyState message="Select a page to edit." />
          ) : (
            <>
              <div className="admin-form-group">
                <label>Title</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
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
                  <label>Section {sectionIndex + 1}</label>
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
                className="admin-btn admin-btn--primary"
                disabled={saveMutation.isPending}
                onClick={() => draft && saveMutation.mutate(draft)}
              >
                {saveMutation.isPending ? "Saving…" : "Save page"}
              </button>
              {saved ? (
                <span style={{ marginLeft: "0.75rem", color: "var(--admin-success)" }}>
                  Saved
                </span>
              ) : null}
            </>
          )}
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
