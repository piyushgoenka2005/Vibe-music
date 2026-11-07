"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Save,
  ExternalLink,
  PanelBottom,
  Share2,
  ShieldCheck,
  Eye,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import { useToastStore } from "@/store/toastStore";
import type { FooterConfig } from "@/app/api/admin/footer/route";

interface EditLinkModalState {
  sectionId: string;
  linkIndex: number | null; // null means new link
  label: string;
  url: string;
  external: boolean;
  isActive: boolean;
}

function FooterManagementContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<FooterConfig | null>(null);
  const [modalState, setModalState] = useState<EditLinkModalState | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-footer"],
    queryFn: async () => {
      return adminFetchJson<{ config: FooterConfig }>("/api/admin/footer");
    },
    staleTime: 60_000,
  });

  const config = draft ?? data?.config;

  const saveMutation = useMutation({
    mutationFn: async (updated: FooterConfig) => {
      await adminMutateJson("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-footer"] });
      setDraft(null);
      useToastStore.getState().show("Footer configuration saved successfully!", "success");
    },
    onError: (err) => {
      useToastStore
        .getState()
        .show(err instanceof Error ? err.message : "Failed to save footer configuration", "error");
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError || !config) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load footer configuration."}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  function updateConfig(updater: (prev: FooterConfig) => FooterConfig) {
    if (!canWrite) return;
    setDraft((prev) => updater(prev ?? config!));
  }

  function handleSave() {
    if (!config) return;
    saveMutation.mutate(config);
  }

  function toggleFollowSection() {
    updateConfig((prev) => ({
      ...prev,
      followSectionEnabled: !prev.followSectionEnabled,
    }));
  }

  function moveLink(sectionId: string, index: number, direction: -1 | 1) {
    updateConfig((prev) => {
      const nextSections = prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const newLinks = [...section.links];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newLinks.length) return section;
        const [moved] = newLinks.splice(index, 1);
        newLinks.splice(targetIndex, 0, moved);
        return {
          ...section,
          links: newLinks.map((item, idx) => ({ ...item, sortOrder: idx })),
        };
      });
      return { ...prev, sections: nextSections };
    });
  }

  function deleteLink(sectionId: string, index: number) {
    updateConfig((prev) => {
      const nextSections = prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const newLinks = section.links.filter((_, idx) => idx !== index);
        return {
          ...section,
          links: newLinks.map((item, idx) => ({ ...item, sortOrder: idx })),
        };
      });
      return { ...prev, sections: nextSections };
    });
  }

  function toggleLinkActive(sectionId: string, index: number) {
    updateConfig((prev) => {
      const nextSections = prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const newLinks = section.links.map((link, idx) =>
          idx === index ? { ...link, isActive: !link.isActive } : link,
        );
        return { ...section, links: newLinks };
      });
      return { ...prev, sections: nextSections };
    });
  }

  function saveModalLink() {
    if (!modalState) return;
    const { sectionId, linkIndex, label, url, external, isActive } = modalState;
    if (!label.trim() || !url.trim()) {
      useToastStore.getState().show("Label and URL are required", "error");
      return;
    }

    updateConfig((prev) => {
      const nextSections = prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const newLinks = [...section.links];
        if (linkIndex === null) {
          // New link
          newLinks.push({
            id: `link-${Date.now()}`,
            label: label.trim(),
            url: url.trim(),
            external,
            isActive,
            sortOrder: newLinks.length,
          });
        } else {
          // Edit link
          newLinks[linkIndex] = {
            ...newLinks[linkIndex],
            label: label.trim(),
            url: url.trim(),
            external,
            isActive,
          };
        }
        return { ...section, links: newLinks };
      });
      return { ...prev, sections: nextSections };
    });

    setModalState(null);
  }

  return (
    <div className="admin-page">
      {/* Top Header Controls */}
      <div
        className="admin-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <PanelBottom size={20} color="var(--admin-accent)" />
            Storefront Footer Management
          </h2>
          <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            Configure footer accordion columns, links, social follow channels, and verified business
            legal notes.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => setPreviewOpen(!previewOpen)}
          >
            <Eye size={16} /> {previewOpen ? "Hide Preview" : "Preview Footer"}
          </button>
          {canWrite && (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saveMutation.isPending}
              onClick={handleSave}
            >
              <Save size={16} /> {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {/* Live Storefront Footer Preview */}
      {previewOpen && (
        <div
          className="admin-card"
          style={{
            marginBottom: "1.5rem",
            background: "#0c0d0e",
            color: "#f4f4f5",
            borderRadius: "var(--admin-radius)",
            padding: "1.5rem",
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#a1a1aa",
              marginBottom: "1rem",
            }}
          >
            Live Storefront Footer Preview
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {config.sections.map((section) => (
              <div key={section.id}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    borderBottom: "1px solid #3f3f46",
                    paddingBottom: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {section.label}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {section.links
                    .filter((l) => l.isActive)
                    .map((link) => (
                      <li key={link.id} style={{ marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.8125rem", color: "#d4d4d8" }}>
                          {link.label} {link.external ? "↗" : ""}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid #27272a",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              fontSize: "0.75rem",
              color: "#71717a",
            }}
          >
            {config.businessIdentity.legalName} • {config.businessIdentity.address} • GSTIN:{" "}
            {config.businessIdentity.gstin}
          </div>
        </div>
      )}

      {/* General Settings: Social & Legal */}
      <div className="admin-grid admin-grid--2" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Share2 size={16} /> 04 / Follow Social Channels
            </h3>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.8125rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={config.followSectionEnabled}
                onChange={toggleFollowSection}
                disabled={!canWrite}
              />
              Show in Footer
            </label>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--admin-muted)", marginBottom: "1rem" }}>
            Toggles customer-facing social media channel links in Section 4.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Object.entries(config.socialLinks).map(([platform, url]) => (
              <div key={platform} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    width: "90px",
                    fontSize: "0.8125rem",
                    textTransform: "capitalize",
                    fontWeight: 500,
                  }}
                >
                  {platform}:
                </span>
                <input
                  type="text"
                  className="admin-input"
                  style={{ flex: 1, fontSize: "0.8125rem" }}
                  value={url}
                  disabled={!canWrite}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, [platform]: newUrl },
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              margin: "0 0 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <ShieldCheck size={16} /> Legal & Grievance Information
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--admin-muted)", display: "block" }}>
                Legal Entity Name
              </label>
              <input
                type="text"
                className="admin-input"
                style={{ width: "100%", fontSize: "0.8125rem" }}
                value={config.businessIdentity.legalName}
                disabled={!canWrite}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig((prev) => ({
                    ...prev,
                    businessIdentity: { ...prev.businessIdentity, legalName: val },
                  }));
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--admin-muted)", display: "block" }}>
                GSTIN Number
              </label>
              <input
                type="text"
                className="admin-input"
                style={{ width: "100%", fontSize: "0.8125rem" }}
                value={config.businessIdentity.gstin}
                disabled={!canWrite}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig((prev) => ({
                    ...prev,
                    businessIdentity: { ...prev.businessIdentity, gstin: val },
                  }));
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--admin-muted)", display: "block" }}>
                Grievance Officer Name & Email
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  className="admin-input"
                  style={{ flex: 1, fontSize: "0.8125rem" }}
                  placeholder="Officer Name"
                  value={config.businessIdentity.grievanceOfficerName}
                  disabled={!canWrite}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      businessIdentity: { ...prev.businessIdentity, grievanceOfficerName: val },
                    }));
                  }}
                />
                <input
                  type="email"
                  className="admin-input"
                  style={{ flex: 1, fontSize: "0.8125rem" }}
                  placeholder="Officer Email"
                  value={config.businessIdentity.grievanceOfficerEmail}
                  disabled={!canWrite}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      businessIdentity: { ...prev.businessIdentity, grievanceOfficerEmail: val },
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections and Links Builder */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {config.sections.map((section) => (
          <div key={section.id} className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--admin-border)",
                background: "var(--admin-surface-2)",
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{section.label}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--admin-muted)",
                    marginLeft: "0.75rem",
                  }}
                >
                  ({section.links.length} links)
                </span>
              </div>
              {canWrite && (
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  style={{ padding: "0.3rem 0.65rem", fontSize: "0.8125rem" }}
                  onClick={() =>
                    setModalState({
                      sectionId: section.id,
                      linkIndex: null,
                      label: "",
                      url: "",
                      external: false,
                      isActive: true,
                    })
                  }
                >
                  <Plus size={14} /> Add Link
                </button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Link Label</th>
                    <th style={{ width: "35%" }}>Destination URL</th>
                    <th style={{ width: "10%" }}>Target</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {section.links.map((link, index) => (
                    <tr key={link.id || index}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{link.label}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.8125rem", color: "var(--admin-accent)" }}>
                          {link.url}
                        </code>
                      </td>
                      <td>
                        {link.external ? (
                          <span className="admin-badge admin-badge--neutral">
                            <ExternalLink size={12} /> New Tab
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge--neutral">Internal</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`admin-badge ${link.isActive ? "admin-badge--success" : "admin-badge--neutral"}`}
                          style={{ cursor: canWrite ? "pointer" : "default" }}
                          onClick={() => canWrite && toggleLinkActive(section.id, index)}
                        >
                          {link.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.25rem" }}>
                          {canWrite && (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost"
                                disabled={index === 0}
                                onClick={() => moveLink(section.id, index, -1)}
                                style={{ padding: "0.25rem" }}
                                title="Move Up"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost"
                                disabled={index === section.links.length - 1}
                                onClick={() => moveLink(section.id, index, 1)}
                                style={{ padding: "0.25rem" }}
                                title="Move Down"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost"
                                onClick={() =>
                                  setModalState({
                                    sectionId: section.id,
                                    linkIndex: index,
                                    label: link.label,
                                    url: link.url,
                                    external: Boolean(link.external),
                                    isActive: link.isActive,
                                  })
                                }
                                style={{ padding: "0.25rem" }}
                                title="Edit Link"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger"
                                onClick={() => deleteLink(section.id, index)}
                                style={{ padding: "0.25rem 0.5rem" }}
                                title="Delete Link"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {section.links.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          color: "var(--admin-muted)",
                          padding: "1.5rem",
                        }}
                      >
                        No links in this section. Click &ldquo;Add Link&rdquo; to add navigation
                        items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog for Add/Edit Link */}
      {modalState && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="admin-card"
            style={{
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 1rem" }}>
              {modalState.linkIndex === null ? "Add Footer Link" : "Edit Footer Link"}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Link Label
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%" }}
                  placeholder="e.g. Terms & Conditions"
                  value={modalState.label}
                  onChange={(e) => setModalState({ ...modalState, label: e.target.value })}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Destination URL
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%" }}
                  placeholder="e.g. /pages/terms or https://..."
                  value={modalState.url}
                  onChange={(e) => setModalState({ ...modalState, url: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={modalState.external}
                    onChange={(e) => setModalState({ ...modalState, external: e.target.checked })}
                  />
                  Open in New Tab
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={modalState.isActive}
                    onChange={(e) => setModalState({ ...modalState, isActive: e.target.checked })}
                  />
                  Active
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
                  onClick={() => setModalState(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={saveModalLink}
                >
                  {modalState.linkIndex === null ? "Add Link" : "Update Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFooterPage() {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell admin={session} title="Footer Management">
          <FooterManagementContent
            canWrite={
              session.role === "super_admin" ||
              (session.permissions ?? []).includes("settings:write")
            }
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
