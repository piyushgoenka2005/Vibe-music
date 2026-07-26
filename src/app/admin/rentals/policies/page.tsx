"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { LoadingState } from "@/components/admin/AdminUi";
import type { AdminSession } from "@/types/admin";

type PolicyForm = {
  title: string;
  termsHtml: string;
  agreementHtml: string;
  cancellationPolicy: string;
  lateFeePolicy: string;
  damagePolicy: string;
};

const EMPTY_FORM: PolicyForm = {
  title: "",
  termsHtml: "",
  agreementHtml: "",
  cancellationPolicy: "",
  lateFeePolicy: "",
  damagePolicy: "",
};

function PoliciesAdmin({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PolicyForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-rental-policy"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/policy");
      if (!res.ok) throw new Error("Failed to load policy");
      return res.json() as Promise<{ policy: PolicyForm | null }>;
    },
  });

  useEffect(() => {
    if (!data || hydrated) return;
    if (data.policy) {
      setForm({
        title: data.policy.title ?? "",
        termsHtml: data.policy.termsHtml ?? "",
        agreementHtml: data.policy.agreementHtml ?? "",
        cancellationPolicy: data.policy.cancellationPolicy ?? "",
        lateFeePolicy: data.policy.lateFeePolicy ?? "",
        damagePolicy: data.policy.damagePolicy ?? "",
      });
    }
    setHydrated(true);
  }, [data, hydrated]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title is required");
      const res = await fetch("/api/admin/rentals/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
    },
    onSuccess: () => {
      setActionError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-policy"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  if (isLoading || !hydrated) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message="Unable to load rental policies."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__body">
        {actionError ? (
          <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
            <p className="admin-error__message">{actionError}</p>
          </div>
        ) : null}
        {saved ? (
          <p style={{ margin: "0 0 1rem", color: "var(--admin-muted)" }}>Policies saved.</p>
        ) : null}
        <div className="admin-form-grid">
          <div className="admin-form-group admin-form-grid--full">
            <label>Title</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={form.title}
              disabled={!canWrite}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Cancellation policy</label>
            <textarea
              className="admin-textarea"
              value={form.cancellationPolicy}
              disabled={!canWrite}
              onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Late fee policy</label>
            <textarea
              className="admin-textarea"
              value={form.lateFeePolicy}
              disabled={!canWrite}
              onChange={(e) => setForm({ ...form, lateFeePolicy: e.target.value })}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Damage policy</label>
            <textarea
              className="admin-textarea"
              value={form.damagePolicy}
              disabled={!canWrite}
              onChange={(e) => setForm({ ...form, damagePolicy: e.target.value })}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Terms (HTML)</label>
            <textarea
              className="admin-textarea"
              style={{ minHeight: 120 }}
              value={form.termsHtml}
              disabled={!canWrite}
              onChange={(e) => setForm({ ...form, termsHtml: e.target.value })}
            />
          </div>
          <div className="admin-form-group admin-form-grid--full">
            <label>Rental agreement (HTML)</label>
            <textarea
              className="admin-textarea"
              style={{ minHeight: 120 }}
              value={form.agreementHtml}
              disabled={!canWrite}
              onChange={(e) => setForm({ ...form, agreementHtml: e.target.value })}
            />
          </div>
        </div>
        {canWrite ? (
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : "Save policies"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminRentalPoliciesPage() {
  return (
    <AdminGuard>
      {(admin: AdminSession) => (
        <AdminShell admin={admin} title="Rental policies">
          <PoliciesAdmin canWrite={admin.permissions.includes("rentals:write")} />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
