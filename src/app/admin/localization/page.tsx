"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Globe, Coins, Receipt, Languages, CheckCircle2, Clock, Save } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import type {
  CurrencyConfig,
  LocaleConfig,
  RegionalPreferences,
} from "@/app/api/admin/localization/route";

type ActiveTab = "languages" | "currencies" | "preferences";

function LocalizationContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("languages");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-localization"],
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      return adminFetchJson<{
        currencies: CurrencyConfig[];
        locales: LocaleConfig[];
        preferences: RegionalPreferences;
        stats: {
          baseCurrency: string;
          totalCurrencies: number;
          activeLocales: number;
          timezone: string;
          gstMode: string;
        };
      }>("/api/admin/localization");
    },
  });

  const [localLocales, setLocalLocales] = useState<LocaleConfig[] | null>(null);
  const [localCurrencies, setLocalCurrencies] = useState<CurrencyConfig[] | null>(null);
  const [localPreferences, setLocalPreferences] = useState<RegionalPreferences | null>(null);

  const locales = localLocales ?? data?.locales ?? [];
  const currencies = localCurrencies ?? data?.currencies ?? [];
  const preferences = localPreferences ??
    data?.preferences ?? {
      timezone: "Asia/Kolkata (IST, UTC+05:30)",
      dateFormat: "DD/MM/YYYY",
      numberFormat: "indian",
      fiscalYearStart: "01-04",
      gstEnabled: true,
      fulfillmentStateCode: "27",
      fulfillmentStateName: "Maharashtra",
    };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await adminMutateJson("/api/admin/localization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locales,
          currencies,
          preferences,
        }),
      });
    },
    onSuccess: () => {
      setSaveSuccess("Localization settings saved successfully.");
      setTimeout(() => setSaveSuccess(null), 3500);
      queryClient.invalidateQueries({ queryKey: ["admin-localization"] });
    },
  });

  const toggleLocale = (code: string) => {
    if (!canWrite) return;
    const updated = locales.map((l) => (l.code === code ? { ...l, isActive: !l.isActive } : l));
    setLocalLocales(updated);
  };

  const updateRate = (code: string, newRate: number) => {
    if (!canWrite) return;
    const updated = currencies.map((c) => (c.code === code ? { ...c, exchangeRate: newRate } : c));
    setLocalCurrencies(updated);
  };

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load store localization settings."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const stats = data?.stats ?? {
    baseCurrency: "INR (₹)",
    totalCurrencies: currencies.length,
    activeLocales: locales.filter((l) => l.isActive).length,
    timezone: "Asia/Kolkata (IST)",
    gstMode: "Dynamic Intra/Inter-state",
  };

  return (
    <div className="admin-page">
      {/* Toast Notice */}
      {saveSuccess && (
        <div
          className="admin-badge admin-badge--success"
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          <CheckCircle2 size={16} />
          {saveSuccess}
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="admin-grid admin-grid--4" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Primary Base Currency</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}
            >
              <Coins size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.baseCurrency}</div>
          <div className="admin-kpi__sub">Indian Rupee checkout currency</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Regional Languages</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-success-soft)", color: "var(--admin-success)" }}
            >
              <Languages size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{stats.activeLocales} Active</div>
          <div className="admin-kpi__sub">Indian regional languages</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Standard Timezone</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-warning-soft)", color: "var(--admin-warning)" }}
            >
              <Clock size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">IST (UTC+5:30)</div>
          <div className="admin-kpi__sub">Asia/Kolkata standard time</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">GST Tax Model</span>
            <span
              className="admin-kpi__icon"
              style={{
                background: "var(--admin-kpi-products-soft)",
                color: "var(--admin-kpi-products)",
              }}
            >
              <Receipt size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">CGST+SGST / IGST</div>
          <div className="admin-kpi__sub">Dynamic state tax resolution</div>
        </div>
      </div>

      {/* Navigation Tabs & Actions */}
      <div className="admin-card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className={`admin-btn ${activeTab === "languages" ? "admin-btn--primary" : "admin-btn--secondary"}`}
              onClick={() => setActiveTab("languages")}
            >
              <Languages size={16} /> Regional Languages ({locales.length})
            </button>
            <button
              type="button"
              className={`admin-btn ${activeTab === "currencies" ? "admin-btn--primary" : "admin-btn--secondary"}`}
              onClick={() => setActiveTab("currencies")}
            >
              <Coins size={16} /> Multi-Currency ({currencies.length})
            </button>
            <button
              type="button"
              className={`admin-btn ${activeTab === "preferences" ? "admin-btn--primary" : "admin-btn--secondary"}`}
              onClick={() => setActiveTab("preferences")}
            >
              <Globe size={16} /> Indian Format & GST
            </button>
          </div>

          {canWrite && (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              <Save size={16} />
              {saveMutation.isPending ? "Saving Settings…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Regional Languages */}
      {activeTab === "languages" && (
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--admin-border)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
              Regional Indian Languages & Storefront Translations
            </h2>
            <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
              Enable regional language interfaces for music creators and customers across India.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Language Name</th>
                  <th>Native Script</th>
                  <th>Locale Code</th>
                  <th>Text Direction</th>
                  <th>Translation Status</th>
                  <th>State</th>
                  {canWrite && <th style={{ textAlign: "right" }}>Toggle</th>}
                </tr>
              </thead>
              <tbody>
                {locales.map((loc) => (
                  <tr key={loc.code}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>
                        {loc.name}{" "}
                        {loc.isDefault && (
                          <span
                            className="admin-badge admin-badge--primary"
                            style={{ marginLeft: "0.4rem" }}
                          >
                            Default Storefront
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{ fontSize: "1rem", fontWeight: 500, color: "var(--admin-accent)" }}
                      >
                        {loc.nativeName}
                      </span>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: "0.75rem",
                          background: "var(--admin-surface-2)",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        {loc.code}
                      </code>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge--neutral">
                        {loc.direction.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ minWidth: "160px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                          style={{
                            flex: 1,
                            background: "var(--admin-surface-2)",
                            height: "6px",
                            borderRadius: "9999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${loc.translationCoverage}%`,
                              height: "100%",
                              background:
                                loc.translationCoverage >= 90
                                  ? "var(--admin-success)"
                                  : "var(--admin-warning)",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--admin-muted)",
                            minWidth: "32px",
                          }}
                        >
                          {loc.translationCoverage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {loc.isActive ? (
                        <span className="admin-badge admin-badge--success">Active</span>
                      ) : (
                        <span className="admin-badge admin-badge--neutral">Disabled</span>
                      )}
                    </td>
                    {canWrite && (
                      <td style={{ textAlign: "right" }}>
                        {!loc.isDefault && (
                          <button
                            type="button"
                            className={`admin-btn ${loc.isActive ? "admin-btn--secondary" : "admin-btn--primary"}`}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem" }}
                            onClick={() => toggleLocale(loc.code)}
                          >
                            {loc.isActive ? "Disable" : "Enable"}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Currencies & Conversion */}
      {activeTab === "currencies" && (
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--admin-border)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
              Currencies & Exchange Rates
            </h2>
            <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
              Vibe Music processes checkouts in Indian Rupee (INR ₹). Non-INR currencies provide
              real-time price estimates for international visitors.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Symbol</th>
                  <th>Exchange Rate (1 INR =)</th>
                  <th>Format Placement</th>
                  <th>Decimal Places</th>
                  <th>Role</th>
                  {canWrite && <th style={{ textAlign: "right" }}>Update Rate</th>}
                </tr>
              </thead>
              <tbody>
                {currencies.map((curr) => (
                  <tr key={curr.code}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--admin-text)" }}>
                        {curr.name} ({curr.code})
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: 700,
                          color: "var(--admin-accent)",
                        }}
                      >
                        {curr.symbol}
                      </span>
                    </td>
                    <td>
                      {curr.isBase ? (
                        <span style={{ fontWeight: 600, color: "var(--admin-text)" }}>
                          1.0000 (Base)
                        </span>
                      ) : (
                        <span style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                          {curr.exchangeRate.toFixed(4)} {curr.code}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className="admin-badge admin-badge--neutral"
                        style={{ textTransform: "capitalize" }}
                      >
                        {curr.symbolPosition} (
                        {curr.symbolPosition === "prefix"
                          ? `${curr.symbol}100`
                          : `100${curr.symbol}`}
                        )
                      </span>
                    </td>
                    <td>{curr.decimalPlaces} decimals</td>
                    <td>
                      {curr.isBase ? (
                        <span className="admin-badge admin-badge--primary">Primary Settlement</span>
                      ) : (
                        <span className="admin-badge admin-badge--info">Display Estimate</span>
                      )}
                    </td>
                    {canWrite && (
                      <td style={{ textAlign: "right" }}>
                        {!curr.isBase && (
                          <div
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                          >
                            <input
                              type="number"
                              step="0.0001"
                              className="admin-input"
                              style={{
                                width: "90px",
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.8125rem",
                              }}
                              value={curr.exchangeRate}
                              onChange={(e) =>
                                updateRate(curr.code, parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Indian Regional & GST Preferences */}
      {activeTab === "preferences" && (
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Indian Regional Standards & Tax Architecture
          </h2>
          <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem", marginBottom: "1.5rem" }}>
            Configure nationwide fulfillment origin, numbering format (Lakhs / Crores), and GST tax
            rules.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div>
              <label className="admin-label">Default Fulfillment State (GST Origin)</label>
              <select
                className="admin-select"
                value={preferences.fulfillmentStateCode}
                disabled={!canWrite}
                onChange={(e) => {
                  const code = e.target.value;
                  const name =
                    code === "27" ? "Maharashtra" : code === "29" ? "Karnataka" : "Delhi";
                  setLocalPreferences((prev) => ({
                    ...(prev ?? preferences),
                    fulfillmentStateCode: code,
                    fulfillmentStateName: name,
                  }));
                }}
              >
                <option value="27">Maharashtra (Code 27) - Mumbai Hub</option>
                <option value="29">Karnataka (Code 29) - Bengaluru Hub</option>
                <option value="07">Delhi (Code 07) - NCR Hub</option>
              </select>
              <p style={{ fontSize: "0.75rem", color: "var(--admin-muted)", marginTop: "0.35rem" }}>
                Orders shipped within this state apply CGST + SGST (9%+9%). Inter-state orders apply
                IGST (18%).
              </p>
            </div>

            <div>
              <label className="admin-label">Number Formatting Style</label>
              <select
                className="admin-select"
                value={preferences.numberFormat}
                disabled={!canWrite}
                onChange={(e) =>
                  setLocalPreferences((prev) => ({
                    ...(prev ?? preferences),
                    numberFormat: e.target.value as "indian" | "international",
                  }))
                }
              >
                <option value="indian">Indian System (e.g. ₹1,25,000 Lakhs)</option>
                <option value="international">International System (e.g. ₹125,000 Millions)</option>
              </select>
              <p style={{ fontSize: "0.75rem", color: "var(--admin-muted)", marginTop: "0.35rem" }}>
                Controls how cart totals, catalog prices, and sales figures render.
              </p>
            </div>

            <div>
              <label className="admin-label">Date Display Format</label>
              <select
                className="admin-select"
                value={preferences.dateFormat}
                disabled={!canWrite}
                onChange={(e) =>
                  setLocalPreferences((prev) => ({
                    ...(prev ?? preferences),
                    dateFormat: e.target.value,
                  }))
                }
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                <option value="MMM D, YYYY">MMM D, YYYY (e.g. Oct 22, 2026)</option>
              </select>
            </div>

            <div>
              <label className="admin-label">Fiscal Financial Year Start</label>
              <select
                className="admin-select"
                value={preferences.fiscalYearStart}
                disabled={!canWrite}
                onChange={(e) =>
                  setLocalPreferences((prev) => ({
                    ...(prev ?? preferences),
                    fiscalYearStart: e.target.value,
                  }))
                }
              >
                <option value="01-04">April 1st (Indian Standard Fiscal Year)</option>
                <option value="01-01">January 1st (Calendar Year)</option>
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--admin-border)",
            }}
          >
            <label
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={preferences.gstEnabled}
                disabled={!canWrite}
                onChange={(e) =>
                  setLocalPreferences((prev) => ({
                    ...(prev ?? preferences),
                    gstEnabled: e.target.checked,
                  }))
                }
              />
              <div>
                <div style={{ fontWeight: 600 }}>
                  Enable Automated GST Invoicing & Rate Segregation
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                  Generates GST compliant B2B/B2C tax invoices with customer GSTIN, HSN codes, and
                  state breakdown.
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLocalizationPage() {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell admin={session} title="Localization & Regional Settings">
          <LocalizationContent canWrite={session.permissions.includes("settings:write")} />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
