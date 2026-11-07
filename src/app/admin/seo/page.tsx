"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Globe,
  FileCode,
  CheckCircle2,
  Save,
  Share2,
  ExternalLink,
  Bot,
  Sparkles,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import { useToastStore } from "@/store/toastStore";
import type { SeoSettings } from "@/app/api/admin/seo/route";

type SeoTab = "meta" | "robots" | "sitemap" | "analytics";

function SeoManagementContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SeoTab>("meta");
  const [draft, setDraft] = useState<SeoSettings | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-seo"],
    queryFn: async () => {
      return adminFetchJson<{ settings: SeoSettings }>("/api/admin/seo");
    },
    staleTime: 60_000,
  });

  const form = draft ?? data?.settings;

  const saveMutation = useMutation({
    mutationFn: async (updated: SeoSettings) => {
      await adminMutateJson("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seo"] });
      setDraft(null);
      useToastStore.getState().show("SEO & Sitemap settings saved successfully!", "success");
    },
    onError: (err) => {
      useToastStore
        .getState()
        .show(err instanceof Error ? err.message : "Failed to save SEO settings", "error");
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError || !form) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load SEO settings."}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  function updateField<K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) {
    if (!form || !canWrite) return;
    setDraft({ ...form, [key]: value });
  }

  function handleSave() {
    if (!form) return;
    saveMutation.mutate(form);
  }

  return (
    <div className="admin-page">
      {/* Header bar */}
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
            <Search size={20} color="var(--admin-accent)" />
            Search Engine Optimization (SEO) & Sitemap
          </h2>
          <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
            Control default metadata, Open Graph cards, robots.txt crawler rules, XML sitemap
            generation, and search console verification.
          </p>
        </div>

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

      {/* Navigation Tabs */}
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
          className={`admin-btn ${activeTab === "meta" ? "admin-btn--primary" : "admin-btn--ghost"}`}
          onClick={() => setActiveTab("meta")}
          style={{ borderRadius: "var(--admin-radius-sm) var(--admin-radius-sm) 0 0" }}
        >
          <Globe size={16} /> Meta Tags & Social Cards
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === "robots" ? "admin-btn--primary" : "admin-btn--ghost"}`}
          onClick={() => setActiveTab("robots")}
          style={{ borderRadius: "var(--admin-radius-sm) var(--admin-radius-sm) 0 0" }}
        >
          <Bot size={16} /> Robots.txt Directives
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === "sitemap" ? "admin-btn--primary" : "admin-btn--ghost"}`}
          onClick={() => setActiveTab("sitemap")}
          style={{ borderRadius: "var(--admin-radius-sm) var(--admin-radius-sm) 0 0" }}
        >
          <FileCode size={16} /> XML Sitemap
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === "analytics" ? "admin-btn--primary" : "admin-btn--ghost"}`}
          onClick={() => setActiveTab("analytics")}
          style={{ borderRadius: "var(--admin-radius-sm) var(--admin-radius-sm) 0 0" }}
        >
          <CheckCircle2 size={16} /> Webmaster & Analytics
        </button>
      </div>

      {/* Tab: Meta Tags & Social */}
      {activeTab === "meta" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="admin-grid admin-grid--2">
            <div className="admin-card">
              <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" }}>
                Default Global Meta Tags
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
                    Default Page Title
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={form.siteTitle}
                    disabled={!canWrite}
                    onChange={(e) => updateField("siteTitle", e.target.value)}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--admin-muted)",
                      marginTop: "0.25rem",
                      display: "block",
                    }}
                  >
                    Recommended: 50-60 characters ({form.siteTitle.length} chars)
                  </span>
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
                    Meta Description
                  </label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    style={{ width: "100%", resize: "vertical" }}
                    value={form.metaDescription}
                    disabled={!canWrite}
                    onChange={(e) => updateField("metaDescription", e.target.value)}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--admin-muted)",
                      marginTop: "0.25rem",
                      display: "block",
                    }}
                  >
                    Recommended: 150-160 characters ({form.metaDescription.length} chars)
                  </span>
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
                    Global Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={form.keywords}
                    disabled={!canWrite}
                    onChange={(e) => updateField("keywords", e.target.value)}
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
                    Canonical Base URL
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={form.canonicalBaseUrl}
                    disabled={!canWrite}
                    onChange={(e) => updateField("canonicalBaseUrl", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Google SERP Preview Card */}
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
                <Sparkles size={16} color="var(--admin-accent)" />
                Google SERP Snippet Preview
              </h3>
              <p
                style={{ fontSize: "0.8125rem", color: "var(--admin-muted)", marginBottom: "1rem" }}
              >
                Visual appearance in Google search engine result pages.
              </p>

              <div
                style={{
                  background: "#ffffff",
                  color: "#1f1f1f",
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                  border: "1px solid #dfe1e5",
                  boxShadow: "0 1px 6px rgba(32,33,36,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#1a73e8",
                      color: "#fff",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    V
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#202124" }}>
                    Vibe Music{" "}
                    <span style={{ color: "#5f6368" }}>
                      • {form.canonicalBaseUrl || "https://vibemusic.in"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "1.125rem",
                    color: "#1a0dab",
                    cursor: "pointer",
                    textDecoration: "none",
                    lineHeight: 1.3,
                    fontWeight: 400,
                    margin: "0.25rem 0",
                  }}
                >
                  {form.siteTitle || "Vibe Music"}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#4d5156", lineHeight: 1.58 }}>
                  {form.metaDescription || "No description set."}
                </div>
              </div>

              {/* Open Graph & Social Card preview */}
              <div style={{ marginTop: "1.5rem" }}>
                <h4
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    margin: "0 0 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Share2 size={14} /> Open Graph & Twitter Card Settings
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <label
                      style={{ fontSize: "0.75rem", color: "var(--admin-muted)", display: "block" }}
                    >
                      OG Image Asset URL
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ width: "100%", fontSize: "0.8125rem" }}
                      value={form.ogImage}
                      disabled={!canWrite}
                      onChange={(e) => updateField("ogImage", e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--admin-muted)",
                          display: "block",
                        }}
                      >
                        Twitter Card Type
                      </label>
                      <select
                        className="admin-select"
                        style={{ width: "100%", fontSize: "0.8125rem" }}
                        value={form.twitterCard}
                        disabled={!canWrite}
                        onChange={(e) =>
                          updateField(
                            "twitterCard",
                            e.target.value as "summary" | "summary_large_image",
                          )
                        }
                      >
                        <option value="summary_large_image">Summary Large Image</option>
                        <option value="summary">Summary Standard</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--admin-muted)",
                          display: "block",
                        }}
                      >
                        Twitter Handle
                      </label>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ width: "100%", fontSize: "0.8125rem" }}
                        value={form.twitterHandle}
                        disabled={!canWrite}
                        onChange={(e) => updateField("twitterHandle", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Robots.txt Directives */}
      {activeTab === "robots" && (
        <div className="admin-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
                Robots.txt Crawler Directives
              </h3>
              <p
                style={{ fontSize: "0.8125rem", color: "var(--admin-muted)", marginTop: "0.25rem" }}
              >
                Controls search engine web crawlers (Googlebot, Bingbot) and prevents indexing of
                private administrative paths.
              </p>
            </div>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn--secondary"
              style={{ fontSize: "0.8125rem" }}
            >
              <ExternalLink size={14} /> View Live robots.txt
            </a>
          </div>

          <textarea
            className="admin-input"
            rows={10}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
            value={form.robotsTxtDirectives}
            disabled={!canWrite}
            onChange={(e) => updateField("robotsTxtDirectives", e.target.value)}
          />
        </div>
      )}

      {/* Tab: XML Sitemap */}
      {activeTab === "sitemap" && (
        <div className="admin-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
                XML Sitemap Generation & Priority Rules
              </h3>
              <p
                style={{ fontSize: "0.8125rem", color: "var(--admin-muted)", marginTop: "0.25rem" }}
              >
                Configures crawl frequency and priority weighting across products, categories, and
                static pages.
              </p>
            </div>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn--secondary"
              style={{ fontSize: "0.8125rem" }}
            >
              <ExternalLink size={14} /> Open Live sitemap.xml
            </a>
          </div>

          <div className="admin-grid admin-grid--2" style={{ gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Crawl Frequency Directive
              </label>
              <select
                className="admin-select"
                style={{ width: "100%" }}
                value={form.sitemapFrequency}
                disabled={!canWrite}
                onChange={(e) =>
                  updateField(
                    "sitemapFrequency",
                    e.target.value as "always" | "hourly" | "daily" | "weekly" | "monthly",
                  )
                }
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily (Recommended for Ecommerce)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
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
                Homepage Priority (0.0 to 1.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                className="admin-input"
                style={{ width: "100%" }}
                value={form.sitemapPriorityHome}
                disabled={!canWrite}
                onChange={(e) => updateField("sitemapPriorityHome", Number(e.target.value))}
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
                Product Pages Priority (0.0 to 1.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                className="admin-input"
                style={{ width: "100%" }}
                value={form.sitemapPriorityProducts}
                disabled={!canWrite}
                onChange={(e) => updateField("sitemapPriorityProducts", Number(e.target.value))}
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
                Category Listing Priority (0.0 to 1.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                className="admin-input"
                style={{ width: "100%" }}
                value={form.sitemapPriorityCategories}
                disabled={!canWrite}
                onChange={(e) => updateField("sitemapPriorityCategories", Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Webmaster Verification & GA4 */}
      {activeTab === "analytics" && (
        <div className="admin-card">
          <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" }}>
            Search Console & Webmaster Verification
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
                Google Search Console Verification Token
              </label>
              <input
                type="text"
                className="admin-input"
                style={{ width: "100%", fontFamily: "monospace" }}
                placeholder="google-site-verification=..."
                value={form.googleSiteVerification}
                disabled={!canWrite}
                onChange={(e) => updateField("googleSiteVerification", e.target.value)}
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
                Bing Webmaster Tools Verification Token
              </label>
              <input
                type="text"
                className="admin-input"
                style={{ width: "100%", fontFamily: "monospace" }}
                placeholder="e.g. 5F3B4A..."
                value={form.bingSiteVerification}
                disabled={!canWrite}
                onChange={(e) => updateField("bingSiteVerification", e.target.value)}
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
                Google Analytics 4 (GA4) Measurement ID
              </label>
              <input
                type="text"
                className="admin-input"
                style={{ width: "100%", fontFamily: "monospace" }}
                placeholder="G-XXXXXXXXXX"
                value={form.gaMeasurementId}
                disabled={!canWrite}
                onChange={(e) => updateField("gaMeasurementId", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSeoPage() {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell admin={session} title="SEO Management">
          <SeoManagementContent
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
