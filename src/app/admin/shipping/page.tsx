"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState } from "@/components/admin/AdminUi";
import type { ShippingZone } from "@/types/shippingZone";

function emptyZone(): Omit<ShippingZone, "createdAt" | "updatedAt"> {
  return {
    id: "",
    name: "",
    description: "",
    states: [],
    pinCodePrefixes: [],
    methodCharges: { standard: 99, express: 199, overnight: 399 },
    freeShippingThreshold: 9999,
    isActive: true,
    sortOrder: 0,
  };
}

function ShippingContent() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ShippingZone | null>(null);
  const [draft, setDraft] = useState<Omit<ShippingZone, "createdAt" | "updatedAt">>(
    emptyZone()
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shipping-zones"],
    queryFn: async () => {
      const res = await fetch("/api/admin/shipping-zones");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ zones: ShippingZone[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        draft.id ? `/api/admin/shipping-zones/${draft.id}` : "/api/admin/shipping-zones",
        {
          method: draft.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...draft,
            states: draft.states.filter(Boolean),
            pinCodePrefixes: draft.pinCodePrefixes.filter(Boolean),
          }),
        }
      );
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      setSelected(null);
      setDraft(emptyZone());
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/shipping-zones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      setSelected(null);
      setDraft(emptyZone());
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
    },
  });

  if (isLoading) return <LoadingState />;

  const zones = data?.zones ?? [];

  return (
    <div className="admin-grid-2">
      <div className="admin-panel">
        <div className="admin-toolbar">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => {
              setSelected(null);
              setDraft(emptyZone());
            }}
          >
            New zone
          </button>
        </div>
        {zones.length === 0 ? (
          <EmptyState message="No shipping zones configured." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Active</th>
                  <th>Standard</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr
                    key={zone.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelected(zone);
                      setDraft(zone);
                    }}
                  >
                    <td>{zone.name}</td>
                    <td>{zone.isActive ? "Yes" : "No"}</td>
                    <td>₹{zone.methodCharges.standard ?? "—"}</td>
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
            {selected ? "Edit zone" : "Create zone"}
          </h2>
        </div>
        <div className="admin-panel__body">
          <div className="admin-form-group">
            <label>Name</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>Description</label>
            <textarea
              className="admin-textarea"
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>States (comma-separated)</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={draft.states.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  states: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                })
              }
            />
          </div>
          <div className="admin-form-group">
            <label>Pin code prefixes (comma-separated)</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={draft.pinCodePrefixes.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  pinCodePrefixes: e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Standard (₹)</label>
              <input
                className="admin-input"
                type="number"
                value={draft.methodCharges.standard ?? 0}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    methodCharges: {
                      ...draft.methodCharges,
                      standard: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="admin-form-group">
              <label>Express (₹)</label>
              <input
                className="admin-input"
                type="number"
                value={draft.methodCharges.express ?? 0}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    methodCharges: {
                      ...draft.methodCharges,
                      express: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="admin-form-group">
              <label>Overnight (₹)</label>
              <input
                className="admin-input"
                type="number"
                value={draft.methodCharges.overnight ?? 0}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    methodCharges: {
                      ...draft.methodCharges,
                      overnight: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            />
            Active
          </label>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saveMutation.isPending || !draft.name}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : "Save zone"}
            </button>
            {selected ? (
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selected.id)}
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminShippingPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Shipping zones">
          {admin.permissions.includes("settings:write") ? (
            <ShippingContent />
          ) : (
            <EmptyState message="Insufficient permissions." />
          )}
        </AdminShell>
      )}
    </AdminGuard>
  );
}
