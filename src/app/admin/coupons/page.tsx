"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, LoadingState, EmptyState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson, adminMutateJson } from "@/components/admin/AdminQueryState";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import CouponProductPicker from "@/components/admin/CouponProductPicker";
import CouponShareLink from "@/components/admin/CouponShareLink";
import { invalidateActiveCouponsQueries } from "@/lib/coupons/activeCouponsQuery";
import { buildCouponShareUrl } from "@/lib/coupons/couponShareUrl";
import type { Coupon, CouponKind } from "@/types/admin";

/** Common ad-campaign discount presets (percentage, percentage, flat). */
const PRODUCT_AD_PRESETS: Array<{
  label: string;
  type: "percentage" | "flat" | "free_shipping";
  value: number;
}> = [
  { label: "10% off", type: "percentage", value: 10 },
  { label: "₹500 off", type: "flat", value: 500 },
  { label: "Free shipping", type: "free_shipping", value: 0 },
];

const EMPTY_FORM = {
  code: "",
  label: "",
  type: "percentage" as "percentage" | "flat" | "free_shipping",
  value: 10,
  isActive: true,
  kind: "standard" as CouponKind,
  scope: "store" as "store" | "products",
  productIds: [] as string[],
  maxUses: undefined as number | undefined,
  maxUsesPerUser: undefined as number | undefined,
  referralOwnerEmail: "",
  minOrderAmount: undefined as number | undefined,
  maxDiscountAmount: undefined as number | undefined,
  pdpHeadline: "",
  pdpOfferLine: "",
  pdpMaxDiscountLine: "",
  pdpTermsLine: "",
  pdpDisclaimer: "",
  pdpFooter: "",
  startsAt: "",
  expiresAt: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
};

function CouponsContent({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [referralForm, setReferralForm] = useState({
    ownerEmail: "",
    ownerUserId: "",
    templateCouponId: "",
    maxUsesPerUser: 1,
  });

  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } = useAdminCursorPagination();

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["admin-coupons", cursor],
    queryFn: async () => {
      const url = `/api/admin/coupons?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      return adminFetchJson<{
        coupons: Coupon[];
        hasMore: boolean;
        nextCursor?: string;
        total: number;
      }>(url);
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
  });
  const hasMore = data?.hasMore ?? false;

  const openCreateForm = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openProductAdForm = (
    preset: (typeof PRODUCT_AD_PRESETS)[number] = PRODUCT_AD_PRESETS[0],
  ) => {
    setEditId(null);
    setForm({
      ...EMPTY_FORM,
      scope: "products",
      label: `${preset.label} — dedicated product`,
      type: preset.type,
      value: preset.value,
      utmSource: "vibemusic",
      utmMedium: "product-ad",
      utmCampaign: "product-ad",
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
        referralOwnerEmail:
          form.kind === "referral" ? form.referralOwnerEmail || undefined : undefined,
        utmSource: form.utmSource || undefined,
        utmMedium: form.utmMedium || undefined,
        utmCampaign: form.utmCampaign || undefined,
        utmContent: form.utmContent || undefined,
        pdpHeadline: form.pdpHeadline || undefined,
        pdpOfferLine: form.pdpOfferLine || undefined,
        pdpMaxDiscountLine: form.pdpMaxDiscountLine || undefined,
        pdpTermsLine: form.pdpTermsLine || undefined,
        pdpDisclaimer: form.pdpDisclaimer || undefined,
        pdpFooter: form.pdpFooter || undefined,
      };
      const url = editId ? `/api/admin/coupons/${editId}` : "/api/admin/coupons";
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
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      invalidateActiveCouponsQueries(queryClient);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminMutateJson(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      invalidateActiveCouponsQueries(queryClient);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminMutateJson(`/api/admin/coupons/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      setDeleteConfirmId(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      invalidateActiveCouponsQueries(queryClient);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminMutateJson<{ coupon: Coupon }>(`/api/admin/coupons/${id}/duplicate`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      invalidateActiveCouponsQueries(queryClient);
    },
  });

  const referralMutation = useMutation({
    mutationFn: async () => {
      return adminMutateJson<{ coupon: Coupon; shareUrl: string }>(
        "/api/admin/coupons/generate-referral",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerEmail: referralForm.ownerEmail,
            ownerUserId: referralForm.ownerUserId || referralForm.ownerEmail,
            templateCouponId: referralForm.templateCouponId || undefined,
            maxUsesPerUser: referralForm.maxUsesPerUser,
          }),
        },
      );
    },
    onSuccess: () => {
      setShowReferralForm(false);
      setReferralForm({
        ownerEmail: "",
        ownerUserId: "",
        templateCouponId: "",
        maxUsesPerUser: 1,
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      invalidateActiveCouponsQueries(queryClient);
    },
  });

  const fillUtmDefaults = () => {
    setForm((current) => ({
      ...current,
      utmSource: current.utmSource || "vibemusic",
      utmMedium: current.utmMedium || "coupon",
      utmCampaign: current.utmCampaign || current.code.toLowerCase() || "promo",
    }));
  };

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load coupons."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      <div className="admin-toolbar">
        {canWrite ? (
          <>
            <button type="button" className="admin-btn admin-btn--primary" onClick={openCreateForm}>
              Add Coupon
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={() => openProductAdForm()}
            >
              Product ad coupon
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={() => setShowReferralForm((v) => !v)}
            >
              Generate referral
            </button>
          </>
        ) : null}
      </div>

      {deleteMutation.isError ? (
        <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
          <p className="admin-error__message">
            {(deleteMutation.error as Error).message || "Delete failed"}
          </p>
        </div>
      ) : null}

      {saveMutation.isError ? (
        <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
          <p className="admin-error__message">
            {(saveMutation.error as Error).message || "Save failed"}
          </p>
        </div>
      ) : null}

      {showReferralForm && canWrite ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__body">
            <h3 className="admin-panel__title">Generate referral coupon</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Owner email</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="email"
                  value={referralForm.ownerEmail}
                  onChange={(e) => setReferralForm({ ...referralForm, ownerEmail: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Owner user ID (optional)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={referralForm.ownerUserId}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, ownerUserId: e.target.value })
                  }
                  placeholder="Defaults to email if blank"
                />
              </div>
              <div className="admin-form-group">
                <label>Template coupon</label>
                <select
                  className="admin-select"
                  value={referralForm.templateCouponId}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, templateCouponId: e.target.value })
                  }
                >
                  <option value="">Default (10% off)</option>
                  {(data?.coupons ?? [])
                    .filter((c) => c.kind !== "referral")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>Max uses per friend</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={1}
                  value={referralForm.maxUsesPerUser}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      maxUsesPerUser: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            {referralMutation.isError ? (
              <p className="admin-error__message" style={{ marginTop: 8 }}>
                {(referralMutation.error as Error).message || "Referral generation failed"}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={!referralForm.ownerEmail || referralMutation.isPending}
                onClick={() => referralMutation.mutate()}
              >
                Generate
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => setShowReferralForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__body">
            <h3 className="admin-panel__title">{editId ? "Edit coupon" : "New coupon"}</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Code</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="admin-form-group">
                <label>Label</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Kind</label>
                <select
                  className="admin-select"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as CouponKind })}
                >
                  <option value="standard">Standard</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              {form.kind === "referral" ? (
                <div className="admin-form-group">
                  <label>Referral owner email</label>
                  <input
                    className="admin-input"
                    style={{ width: "100%" }}
                    type="email"
                    value={form.referralOwnerEmail}
                    onChange={(e) => setForm({ ...form, referralOwnerEmail: e.target.value })}
                  />
                </div>
              ) : null}
              <div className="admin-form-group">
                <label>Type</label>
                <select
                  className="admin-select"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as "percentage" | "flat" | "free_shipping",
                      value: e.target.value === "free_shipping" ? 0 : form.value,
                    })
                  }
                >
                  <option value="percentage">Percentage off</option>
                  <option value="flat">Fixed amount off</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </div>
              {form.type !== "free_shipping" ? (
                <div className="admin-form-group">
                  <label>Value</label>
                  <input
                    className="admin-input"
                    style={{ width: "100%" }}
                    type="number"
                    min={form.type === "percentage" ? 1 : 1}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                  />
                </div>
              ) : null}
              <div className="admin-form-group">
                <label>Max uses (global)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  value={form.maxUses ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxUses: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>
              <div className="admin-form-group">
                <label>Max uses per user</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={1}
                  value={form.maxUsesPerUser ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxUsesPerUser: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>
              <div className="admin-form-group">
                <label>Min order amount (INR)</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="number"
                  min={0}
                  value={form.minOrderAmount ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minOrderAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional"
                />
              </div>
              {form.type === "percentage" ? (
                <div className="admin-form-group">
                  <label>Max discount cap (INR)</label>
                  <input
                    className="admin-input"
                    style={{ width: "100%" }}
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional — caps % discount"
                  />
                </div>
              ) : null}
              <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Product page display</label>
                <p
                  style={{
                    margin: "0.25rem 0 0.75rem",
                    fontSize: "0.8rem",
                    color: "var(--admin-muted)",
                  }}
                >
                  Shown on product pages (Offers section), cart, and checkout. Link products for
                  product-only coupons, or use storewide for all products. Leave blank to
                  auto-generate copy from discount rules.
                </p>
              </div>
              <div className="admin-form-group">
                <label>PDP headline</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.pdpHeadline}
                  onChange={(e) => setForm({ ...form, pdpHeadline: e.target.value })}
                  placeholder="e.g. Pujo special"
                />
              </div>
              <div className="admin-form-group">
                <label>PDP offer line</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.pdpOfferLine}
                  onChange={(e) => setForm({ ...form, pdpOfferLine: e.target.value })}
                  placeholder="e.g. 15% OFF"
                />
              </div>
              <div className="admin-form-group">
                <label>PDP max discount line</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.pdpMaxDiscountLine}
                  onChange={(e) => setForm({ ...form, pdpMaxDiscountLine: e.target.value })}
                  placeholder="e.g. Maximum Discount ₹500"
                />
              </div>
              <div className="admin-form-group">
                <label>PDP terms line</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.pdpTermsLine}
                  onChange={(e) => setForm({ ...form, pdpTermsLine: e.target.value })}
                  placeholder="e.g. 15% OFF up to ₹500 on orders above ₹2000"
                />
              </div>
              <div className="admin-form-group">
                <label>PDP disclaimer</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.pdpDisclaimer}
                  onChange={(e) => setForm({ ...form, pdpDisclaimer: e.target.value })}
                  placeholder="e.g. Exclusions apply"
                />
              </div>
              <div className="admin-form-group">
                <label>PDP buy-box footer</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.pdpFooter}
                  onChange={(e) => setForm({ ...form, pdpFooter: e.target.value })}
                  placeholder="e.g. Limited time offer"
                />
              </div>
              <div className="admin-form-group">
                <label>Starts At</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Expires At</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active on storefront
                </label>
              </div>
              <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Applies to</label>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="radio"
                      name="coupon-scope"
                      checked={form.scope === "store"}
                      onChange={() => setForm({ ...form, scope: "store", productIds: [] })}
                    />
                    Entire store
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="radio"
                      name="coupon-scope"
                      checked={form.scope === "products"}
                      onChange={() => setForm({ ...form, scope: "products" })}
                    />
                    Specific products (independent per product page)
                  </label>
                </div>
                <p
                  style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "var(--admin-muted)" }}
                >
                  Storewide coupons appear on every product page, cart, and checkout. Product-linked
                  coupons also appear on their assigned product pages.
                </p>
              </div>
              {form.scope === "products" ? (
                <>
                  <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Quick discount presets</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {PRODUCT_AD_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() =>
                            setForm({
                              ...form,
                              type: preset.type,
                              value: preset.value,
                              label: `${preset.label} — dedicated product`,
                            })
                          }
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CouponProductPicker
                    productIds={form.productIds}
                    onChange={(productIds) => setForm({ ...form, productIds })}
                  />
                </>
              ) : null}
              <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <label>UTM tracking</label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={fillUtmDefaults}
                  >
                    Auto-fill UTM
                  </button>
                </div>
              </div>
              <div className="admin-form-group">
                <label>utm_source</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.utmSource}
                  onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>utm_medium</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.utmMedium}
                  onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>utm_campaign</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.utmCampaign}
                  onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>utm_content</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.utmContent}
                  onChange={(e) => setForm({ ...form, utmContent: e.target.value })}
                />
              </div>
              {form.code ? (
                <CouponShareLink
                  code={form.code}
                  utmSource={form.utmSource}
                  utmMedium={form.utmMedium}
                  utmCampaign={form.utmCampaign}
                  utmContent={form.utmContent}
                />
              ) : null}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
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
        {(data?.coupons ?? []).length === 0 ? (
          <EmptyState message="No coupons." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Kind</th>
                  <th>Scope</th>
                  <th>Per user</th>
                  <th>Used</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.coupons ?? []).map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.code}</strong>
                      {c.referralOwnerEmail ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                          {c.referralOwnerEmail}
                        </div>
                      ) : null}
                    </td>
                    <td>{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}</td>
                    <td>{c.kind === "referral" ? "Referral" : "Standard"}</td>
                    <td>
                      {c.scope === "products"
                        ? `${c.productIds.length} product${c.productIds.length === 1 ? "" : "s"}`
                        : "Storewide"}
                    </td>
                    <td>{c.maxUsesPerUser ?? "—"}</td>
                    <td>
                      {c.usedCount}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td>
                      {canWrite ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          style={{ padding: "2px 6px" }}
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })}
                          title={c.isActive ? "Deactivate" : "Activate"}
                        >
                          <StatusBadge status={c.isActive ? "active" : "archived"} />
                        </button>
                      ) : (
                        <StatusBadge status={c.isActive ? "active" : "archived"} />
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {canWrite ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => {
                              setEditId(c.id);
                              setForm({
                                code: c.code,
                                label: c.label,
                                type: c.type,
                                value: c.value,
                                isActive: c.isActive,
                                kind: c.kind ?? "standard",
                                scope: c.scope,
                                productIds: c.productIds ?? [],
                                maxUses: c.maxUses,
                                maxUsesPerUser: c.maxUsesPerUser,
                                referralOwnerEmail: c.referralOwnerEmail ?? "",
                                minOrderAmount: c.minOrderAmount,
                                maxDiscountAmount: c.maxDiscountAmount,
                                pdpHeadline: c.pdpHeadline ?? "",
                                pdpOfferLine: c.pdpOfferLine ?? "",
                                pdpMaxDiscountLine: c.pdpMaxDiscountLine ?? "",
                                pdpTermsLine: c.pdpTermsLine ?? "",
                                pdpDisclaimer: c.pdpDisclaimer ?? "",
                                pdpFooter: c.pdpFooter ?? "",
                                startsAt: c.startsAt?.slice(0, 10) ?? "",
                                expiresAt: c.expiresAt?.slice(0, 10) ?? "",
                                utmSource: c.utmSource ?? "",
                                utmMedium: c.utmMedium ?? "",
                                utmCampaign: c.utmCampaign ?? "",
                                utmContent: c.utmContent ?? "",
                              });
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </button>
                        ) : null}
                        {canWrite ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            disabled={duplicateMutation.isPending}
                            onClick={() => duplicateMutation.mutate(c.id)}
                          >
                            Duplicate
                          </button>
                        ) : null}
                        {c.code ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={() => {
                              const url = buildCouponShareUrl({
                                code: c.code,
                                utmSource: c.utmSource,
                                utmMedium: c.utmMedium,
                                utmCampaign: c.utmCampaign,
                                utmContent: c.utmContent,
                              });
                              void navigator.clipboard.writeText(url);
                            }}
                          >
                            Copy link
                          </button>
                        ) : null}
                        {canDelete ? (
                          deleteConfirmId === c.id ? (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger"
                                onClick={() => deleteMutation.mutate(c.id)}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              onClick={() => setDeleteConfirmId(c.id)}
                            >
                              Delete
                            </button>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
          }}
        >
          <span style={{ color: "var(--admin-muted)", fontSize: "0.85rem" }}>
            Page {pageIndex + 1}
            {typeof data?.total === "number" ? ` · ${data.total} total` : ""}
            {dataUpdatedAt ? ` · updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ""}
            {isFetching ? " · refreshing…" : ""}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!canGoPrev || isFetching}
              onClick={goPrev}
            >
              Previous
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!hasMore || isFetching}
              onClick={() => goNext(data?.nextCursor)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminCouponsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Coupons">
          <CouponsContent
            canWrite={admin.permissions.includes("coupons:write")}
            canDelete={admin.permissions.includes("coupons:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
