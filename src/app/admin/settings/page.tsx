"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import AdminOpsStatusPanel from "@/components/admin/AdminOpsStatusPanel";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, MutationError } from "@/components/admin/AdminQueryState";
import { ROUTES } from "@/lib/routes";
import type { AdminSession, StoreSettings } from "@/types/admin";

function SettingsContent({ admin }: { admin: AdminSession }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ settings: StoreSettings }>;
    },
  });

  const form = data?.settings ?? null;

  const saveMutation = useMutation({
    mutationFn: async (settings: StoreSettings) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  function updateField<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    if (!form) return;
    queryClient.setQueryData(["admin-settings"], { settings: { ...form, [key]: value } });
  }

  if (isLoading) return <LoadingState />;
  if (isError || !form) {
    return (
      <ErrorState
        message="Unable to load store settings."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {admin.permissions.includes("admins:read") ? (
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Team access</h2>
          </div>
          <div className="admin-panel__body">
            <p style={{ margin: "0 0 0.75rem", color: "var(--admin-muted)", fontSize: "0.875rem" }}>
              Invite or promote users who can manage the storefront from the admin panel.
            </p>
            <Link href={ROUTES.adminUsers} className="admin-btn admin-btn--primary">
              Manage admin users
            </Link>
          </div>
        </div>
      ) : null}

    <div className="admin-panel">
      <div className="admin-panel__body">
        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label>Store Name</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.storeName}
              onChange={(e) => updateField("storeName", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Store Email</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              type="email"
              value={form.storeEmail}
              onChange={(e) => updateField("storeEmail", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Store Phone</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.storePhone}
              onChange={(e) => updateField("storePhone", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>GST Number</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.gstNumber}
              onChange={(e) => updateField("gstNumber", e.target.value)}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Store Address</label>
            <textarea
              className="admin-textarea"
              value={form.storeAddress}
              onChange={(e) => updateField("storeAddress", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Default GST Rate (%)</label>
            <select
              className="admin-select"
              value={form.defaultGstRate}
              onChange={(e) =>
                updateField(
                  "defaultGstRate",
                  Number(e.target.value) as StoreSettings["defaultGstRate"]
                )
              }
            >
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Seller State</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.sellerState}
              onChange={(e) => updateField("sellerState", e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>Free Shipping Threshold (₹)</label>
            <p style={{ fontSize: "0.8125rem", color: "var(--admin-muted)", marginBottom: "0.35rem" }}>
              Checkout currently always quotes free shipping. These fields are stored for future paid-shipping modes and do not change customer quotes today. Cart messaging defaults to free shipping (threshold 0) unless NEXT_PUBLIC_CART_FREE_SHIPPING_THRESHOLD is set.
            </p>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              type="number"
              disabled
              readOnly
              value={form.freeShippingThreshold}
              aria-describedby="shipping-settings-note"
            />
          </div>
          <div className="admin-form-group">
            <label>Standard Shipping (₹)</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              type="number"
              disabled
              readOnly
              value={form.standardShippingCharge}
            />
            <p id="shipping-settings-note" style={{ fontSize: "0.75rem", color: "var(--admin-muted)", marginTop: "0.35rem" }}>
              Fields locked while free-shipping policy is forced in checkout.
            </p>
          </div>
          <div className="admin-form-group">
            <label>Razorpay (store flag)</label>
            <p style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>
              {form.razorpayEnabled
                ? "Environment keys detected — see Production integrations below for the full matrix."
                : "Not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server."}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            marginTop: "1.5rem",
          }}
        >
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(form)}
          >
            {saveMutation.isPending ? "Saving…" : "Save Settings"}
          </button>
          {saved ? (
            <span style={{ color: "var(--admin-success)", fontSize: "0.875rem" }}>
              Settings saved
            </span>
          ) : null}
          <MutationError error={saveMutation.isError ? saveMutation.error : null} />
        </div>

        <AdminOpsStatusPanel />
      </div>
    </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Settings">
          <SettingsContent admin={admin} />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
