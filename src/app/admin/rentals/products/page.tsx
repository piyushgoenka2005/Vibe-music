"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { EmptyState, LoadingState, StatusBadge } from "@/components/admin/AdminUi";
import { slugify } from "@/lib/slug";
import type { AdminSession } from "@/types/admin";
import type { RentalAvailabilityBlock, RentalInventoryUnit, RentalProduct } from "@/types/rental";

type ProductForm = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  image: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  hourlyRate: number;
  depositAmount: number;
  totalUnits: number;
  deliveryFee: number;
  pickupFee: number;
  lateFeePerDay: number;
  minDurationHours: number;
  maxDurationDays: number;
  featured: boolean;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  status: "active" | "draft" | "archived";
};

const EMPTY_FORM: ProductForm = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  image: "",
  dailyRate: 500,
  weeklyRate: 0,
  monthlyRate: 0,
  hourlyRate: 0,
  depositAmount: 2000,
  totalUnits: 2,
  deliveryFee: 0,
  pickupFee: 0,
  lateFeePerDay: 0,
  minDurationHours: 24,
  maxDurationDays: 30,
  featured: false,
  pickupAvailable: true,
  deliveryAvailable: true,
  status: "active",
};

function UnitsPanel({
  productId,
  canWrite,
  canDelete,
}: {
  productId: string;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState<RentalInventoryUnit["status"]>("available");
  const [unitError, setUnitError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-rental-units", productId],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/rentals/units?productId=${encodeURIComponent(productId)}`
      );
      if (!res.ok) throw new Error("Failed to load units");
      return res.json() as Promise<{ units: RentalInventoryUnit[] }>;
    },
  });

  function resetUnitForm() {
    setEditingId(null);
    setLabel("");
    setSerialNumber("");
    setStatus("available");
    setUnitError(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!label.trim()) throw new Error("Label required");
      const res = await fetch("/api/admin/rentals/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId ?? undefined,
          productId,
          label: label.trim(),
          serialNumber: serialNumber.trim() || undefined,
          status,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
    },
    onSuccess: () => {
      resetUnitForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-units", productId] });
    },
    onError: (err: Error) => setUnitError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rentals/units?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-units", productId] }),
  });

  if (isLoading) return <LoadingState message="Loading units…" />;

  return (
    <div className="admin-panel" style={{ marginTop: "1rem" }}>
      <div className="admin-panel__header">
        <h2 className="admin-panel__title">Inventory units</h2>
      </div>
      <div className="admin-panel__body">
        {unitError ? (
          <div className="admin-error" role="alert" style={{ marginBottom: "1rem" }}>
            <p className="admin-error__message">{unitError}</p>
          </div>
        ) : null}
        {canWrite ? (
          <div className="admin-form-grid" style={{ marginBottom: "1rem" }}>
            <input
              className="admin-input"
              placeholder="Label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Serial number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
            <select
              className="admin-select"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as RentalInventoryUnit["status"])
              }
            >
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => saveMutation.mutate()}
              >
                {editingId ? "Update unit" : "Add unit"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={resetUnitForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {(data?.units ?? []).length === 0 ? (
          <EmptyState message="No units for this product." />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Serial</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.units ?? []).map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.label}</td>
                  <td>{unit.serialNumber ?? "—"}</td>
                  <td>
                    <StatusBadge status={unit.status} />
                  </td>
                  <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {canWrite ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() => {
                          setEditingId(unit.id);
                          setLabel(unit.label);
                          setSerialNumber(unit.serialNumber ?? "");
                          setStatus(unit.status);
                          setUnitError(null);
                        }}
                      >
                        Edit
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => {
                          if (window.confirm(`Delete unit “${unit.label}”?`)) {
                            deleteMutation.mutate(unit.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AvailabilityBlocksPanel productId={productId} canWrite={canWrite} canDelete={canDelete} />
      </div>
    </div>
  );
}

function AvailabilityBlocksPanel({
  productId,
  canWrite,
  canDelete,
}: {
  productId: string;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const queryClient = useQueryClient();
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [reason, setReason] = useState("maintenance");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-rental-blocks", productId],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/rentals/blocks?productId=${encodeURIComponent(productId)}`
      );
      if (!res.ok) throw new Error("Failed to load blocks");
      return res.json() as Promise<{ blocks: RentalAvailabilityBlock[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!startAt || !endAt) throw new Error("Start and end required");
      const res = await fetch("/api/admin/rentals/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          reason,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
    },
    onSuccess: () => {
      setStartAt("");
      setEndAt("");
      setReason("maintenance");
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-blocks", productId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rentals/blocks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-blocks", productId] }),
  });

  if (isLoading) return <LoadingState message="Loading availability blocks…" />;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h3 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>Availability blocks</h3>
      {canWrite ? (
        <div className="admin-form-grid" style={{ marginBottom: "1rem" }}>
          <input
            className="admin-input"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
          <input
            className="admin-input"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
          <input
            className="admin-input"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => saveMutation.mutate()}
          >
            Block dates
          </button>
        </div>
      ) : null}
      {(data?.blocks ?? []).length === 0 ? (
        <EmptyState message="No availability blocks." />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Start</th>
              <th>End</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.blocks ?? []).map((block) => (
              <tr key={block.id}>
                <td>{new Date(block.startAt).toLocaleString("en-IN")}</td>
                <td>{new Date(block.endAt).toLocaleString("en-IN")}</td>
                <td>{block.reason}</td>
                <td>
                  {canDelete ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      onClick={() => {
                        if (window.confirm("Remove this availability block?")) {
                          deleteMutation.mutate(block.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProductsAdmin({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unitsProductId, setUnitsProductId] = useState<string | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-rental-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json() as Promise<{ categories: Array<{ id: string; name: string }> }>;
    },
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-rental-products"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/products");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ products: RentalProduct[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
      };
      if (!payload.name.trim() || !payload.categoryId) {
        throw new Error("Name and category are required");
      }
      const res = await fetch("/api/admin/rentals/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        product?: RentalProduct;
      };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      return json.product;
    },
    onSuccess: (product) => {
      setShowForm(false);
      setForm(EMPTY_FORM);
      setActionError(null);
      if (product?.id) setUnitsProductId(product.id);
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-products"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rentals/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
    },
    onSuccess: () => {
      setActionError(null);
      setUnitsProductId(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-rental-products"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message="Unable to load rental products."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      {canWrite ? (
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => {
            setForm(EMPTY_FORM);
            setShowForm(true);
            setActionError(null);
          }}
        >
          Add rental product
        </button>
      ) : null}

      {actionError ? (
        <div className="admin-error" role="alert" style={{ margin: "1rem 0" }}>
          <p className="admin-error__message">{actionError}</p>
        </div>
      ) : null}

      {showForm ? (
        <div className="admin-panel" style={{ margin: "1rem 0" }}>
          <div className="admin-panel__body admin-form-grid">
            <input
              className="admin-input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: prev.id ? prev.slug : slugify(name),
                }));
              }}
            />
            <input
              className="admin-input"
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            />
            <select
              className="admin-select"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Category</option>
              {(categoriesData?.categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="admin-select"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as ProductForm["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <input
              className="admin-input"
              type="number"
              placeholder="Hourly rate"
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Daily rate"
              value={form.dailyRate}
              onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Weekly rate"
              value={form.weeklyRate}
              onChange={(e) => setForm({ ...form, weeklyRate: Number(e.target.value) })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Monthly rate"
              value={form.monthlyRate}
              onChange={(e) => setForm({ ...form, monthlyRate: Number(e.target.value) })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Deposit"
              value={form.depositAmount}
              onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Total units"
              min={1}
              value={form.totalUnits}
              onChange={(e) => setForm({ ...form, totalUnits: Number(e.target.value) || 1 })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Delivery fee"
              value={form.deliveryFee}
              onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Pickup fee"
              value={form.pickupFee}
              onChange={(e) => setForm({ ...form, pickupFee: Number(e.target.value) })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Late fee / day"
              value={form.lateFeePerDay}
              onChange={(e) => setForm({ ...form, lateFeePerDay: Number(e.target.value) })}
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Min duration (hours)"
              value={form.minDurationHours}
              onChange={(e) =>
                setForm({ ...form, minDurationHours: Number(e.target.value) || 1 })
              }
            />
            <input
              className="admin-input"
              type="number"
              placeholder="Max duration (days)"
              value={form.maxDurationDays}
              onChange={(e) =>
                setForm({ ...form, maxDurationDays: Number(e.target.value) || 1 })
              }
            />
            <input
              className="admin-input"
              placeholder="Image URL"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            <textarea
              className="admin-textarea"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />{" "}
              Featured
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.pickupAvailable}
                onChange={(e) => setForm({ ...form, pickupAvailable: e.target.checked })}
              />{" "}
              Pickup available
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.deliveryAvailable}
                onChange={(e) => setForm({ ...form, deliveryAvailable: e.target.checked })}
              />{" "}
              Delivery available
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving…" : form.id ? "Update" : "Create"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-panel" style={{ marginTop: "1rem" }}>
        {(data?.products ?? []).length === 0 ? (
          <EmptyState message="No rental products." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Units</th>
                  <th>Daily</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.products ?? []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{p.totalUnits}</td>
                    <td>₹{p.dailyRate}</td>
                    <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() =>
                          setUnitsProductId((prev) => (prev === p.id ? null : p.id))
                        }
                      >
                        {unitsProductId === p.id ? "Hide units" : "Units"}
                      </button>
                      {canWrite ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() => {
                            setForm({
                              id: p.id,
                              name: p.name,
                              slug: p.slug,
                              categoryId: p.categoryId,
                              description: p.description ?? "",
                              image: p.image ?? "",
                              dailyRate: p.dailyRate,
                              weeklyRate: p.weeklyRate ?? 0,
                              monthlyRate: p.monthlyRate ?? 0,
                              hourlyRate: p.hourlyRate ?? 0,
                              depositAmount: p.depositAmount,
                              totalUnits: p.totalUnits,
                              deliveryFee: p.deliveryFee ?? 0,
                              pickupFee: p.pickupFee ?? 0,
                              lateFeePerDay: p.lateFeePerDay ?? 0,
                              minDurationHours: p.minDurationHours ?? 24,
                              maxDurationDays: p.maxDurationDays ?? 30,
                              featured: p.featured ?? false,
                              pickupAvailable: p.pickupAvailable ?? true,
                              deliveryAvailable: p.deliveryAvailable ?? true,
                              status: p.status,
                            });
                            setShowForm(true);
                            setUnitsProductId(p.id);
                            setActionError(null);
                          }}
                        >
                          Edit
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => {
                            if (window.confirm(`Delete rental product “${p.name}”?`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {unitsProductId ? (
        <UnitsPanel
          productId={unitsProductId}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      ) : null}
    </>
  );
}

export default function AdminRentalProductsPage() {
  return (
    <AdminGuard>
      {(admin: AdminSession) => (
        <AdminShell admin={admin} title="Rental products">
          <ProductsAdmin
            canWrite={admin.permissions.includes("rentals:write")}
            canDelete={admin.permissions.includes("rentals:delete")}
          />
        </AdminShell>
      )}
    </AdminGuard>
  );
}
