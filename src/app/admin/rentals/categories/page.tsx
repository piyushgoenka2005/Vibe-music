"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState } from "@/components/admin/AdminUi";

function CategoriesAdmin() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-rental-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/categories");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/rentals/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      setName("");
      setSlug("");
      queryClient.invalidateQueries({ queryKey: ["admin-rental-categories"] });
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <>
      <div className="admin-panel" style={{ marginBottom: "1rem" }}>
        <div className="admin-panel__body admin-form-grid">
          <input className="admin-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="admin-input" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => saveMutation.mutate()}>Add category</button>
        </div>
      </div>
      <div className="admin-panel">
        {(data?.categories ?? []).length === 0 ? (
          <EmptyState message="No rental categories." />
        ) : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Status</th></tr></thead>
            <tbody>
              {(data?.categories ?? []).map((c: { id: string; name: string; slug: string; status: string }) => (
                <tr key={c.id}><td>{c.name}</td><td>{c.slug}</td><td>{c.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function AdminRentalCategoriesPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Rental categories">
          <CategoriesAdmin />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
