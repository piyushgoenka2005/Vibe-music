"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";

function PoliciesAdmin() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-rental-policy"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/policy");
      return res.json();
    },
  });

  const [form, setForm] = useState({
    title: "",
    termsHtml: "",
    agreementHtml: "",
    cancellationPolicy: "",
    lateFeePolicy: "",
    damagePolicy: "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = form.title ? form : data.policy;
      const res = await fetch("/api/admin/rentals/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-rental-policy"] }),
  });

  if (isLoading) return <LoadingState />;
  const policy = data?.policy;
  const values = form.title ? form : policy;

  return (
    <div className="admin-panel">
      <div className="admin-panel__body admin-form-grid">
        {(["title", "cancellationPolicy", "lateFeePolicy", "damagePolicy"] as const).map((key) => (
          <label key={key}>
            {key}
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={values?.[key] ?? ""}
              onChange={(e) => setForm({ ...values, [key]: e.target.value })}
            />
          </label>
        ))}
        <label>
          termsHtml
          <textarea
            className="admin-input"
            style={{ width: "100%", minHeight: 100 }}
            value={values?.termsHtml ?? ""}
            onChange={(e) => setForm({ ...values, termsHtml: e.target.value })}
          />
        </label>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => saveMutation.mutate()}>
          Save policies
        </button>
      </div>
    </div>
  );
}

export default function AdminRentalPoliciesPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Rental policies">
          <PoliciesAdmin />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
