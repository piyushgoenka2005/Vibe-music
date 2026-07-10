"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState, formatDate } from "@/components/admin/AdminUi";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/permissions";
import type { AdminProfile, AdminRole } from "@/types/admin";

function UsersContent({ canInvite }: { canInvite: boolean }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    role: "admin" as AdminRole,
    isActive: true,
  });
  const [inviteForm, setInviteForm] = useState({
    email: "",
    displayName: "",
    role: "admin" as AdminRole,
    password: "",
  });
  const [inviteError, setInviteError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ admins: AdminProfile[] }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const res = await fetch(`/api/admin/admins/${selected.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Update failed");
      }
    },
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      setInviteError(null);
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Invite failed");
      }
    },
    onSuccess: () => {
      setInviteForm({ email: "", displayName: "", role: "admin", password: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      setInviteError(error instanceof Error ? error.message : "Invite failed");
    },
  });

  if (isLoading) return <LoadingState />;

  const admins = data?.admins ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {canInvite ? (
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Invite admin</h2>
        </div>
        <div className="admin-panel__body">
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Email</label>
              <input
                className="admin-input"
                style={{ width: "100%" }}
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="admin-form-group">
              <label>Display name</label>
              <input
                className="admin-input"
                style={{ width: "100%" }}
                value={inviteForm.displayName}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, displayName: e.target.value })
                }
              />
            </div>
            <div className="admin-form-group">
              <label>Role</label>
              <select
                className="admin-select"
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, role: e.target.value as AdminRole })
                }
              >
                {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Temporary password</label>
              <input
                className="admin-input"
                style={{ width: "100%" }}
                type="password"
                value={inviteForm.password}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, password: e.target.value })
                }
              />
            </div>
          </div>
          {inviteError ? (
            <p style={{ color: "var(--admin-danger)", marginTop: "0.75rem" }}>{inviteError}</p>
          ) : null}
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            style={{ marginTop: "1rem" }}
            disabled={inviteMutation.isPending}
            onClick={() => inviteMutation.mutate()}
          >
            {inviteMutation.isPending ? "Creating…" : "Create admin user"}
          </button>
        </div>
      </div>
      ) : null}

      <div className="admin-grid-2">
      <div className="admin-panel">
        {admins.length === 0 ? (
          <EmptyState message="No admin users found." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr
                    key={admin.uid}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelected(admin);
                      setForm({
                        displayName: admin.displayName,
                        role: admin.role,
                        isActive: admin.isActive,
                      });
                    }}
                  >
                    <td>{admin.displayName}</td>
                    <td>{admin.email}</td>
                    <td>{ADMIN_ROLE_LABELS[admin.role]}</td>
                    <td>{admin.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Edit admin</h2>
        </div>
        <div className="admin-panel__body">
          {!selected ? (
            <EmptyState message="Select an admin user." />
          ) : (
            <>
              <p>
                <strong>Email:</strong> {selected.email}
              </p>
              <p>
                <strong>Last login:</strong>{" "}
                {selected.lastLoginAt ? formatDate(selected.lastLoginAt) : "—"}
              </p>
              <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                <label>Display name</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Role</label>
                <select
                  className="admin-select"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as AdminRole })
                  }
                >
                  {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active account
              </label>
              {updateMutation.isError ? (
                <p style={{ color: "var(--admin-danger)", marginTop: "0.75rem" }}>
                  {updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : "Update failed"}
                </p>
              ) : null}
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                style={{ marginTop: "1rem" }}
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Admin users">
          {admin.permissions.includes("admins:read") ? (
            <UsersContent canInvite={admin.permissions.includes("admins:write")} />
          ) : (
            <EmptyState message="Insufficient permissions to view admin users." />
          )}
        </AdminShell>
      )}
    </AdminGuard>
  );
}
