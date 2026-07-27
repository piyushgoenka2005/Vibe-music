"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState, formatDate } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/routes";
import type { AdminProfile, AdminRole } from "@/types/admin";

function generateTempPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function UsersContent({
  canInvite,
  currentUid,
}: {
  canInvite: boolean;
  currentUid: string;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    role: "admin" as AdminRole,
    isActive: true,
    password: "",
  });
  const [inviteForm, setInviteForm] = useState({
    email: "",
    displayName: "",
    role: "admin" as AdminRole,
    password: "",
  });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
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
      const payload: Record<string, unknown> = {
        displayName: form.displayName,
        role: form.role,
        isActive: form.isActive,
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }
      const res = await fetch(`/api/admin/admins/${selected.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Update failed");
      }
      return res.json() as Promise<{ admin: AdminProfile; passwordUpdated?: boolean }>;
    },
    onSuccess: (result) => {
      setSelected(result?.admin ?? null);
      setForm((prev) => ({ ...prev, password: "" }));
      setShowResetPassword(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      setInviteError(null);
      setInviteSuccess(null);
      const payload = {
        email: inviteForm.email.trim(),
        displayName: inviteForm.displayName.trim(),
        role: inviteForm.role,
        ...(inviteForm.password.trim()
          ? { password: inviteForm.password.trim() }
          : {}),
      };
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Invite failed");
      }
      return res.json() as Promise<{
        admin: AdminProfile;
        mode: "created" | "promoted" | "reactivated";
      }>;
    },
    onSuccess: (result) => {
      const labels = {
        created: "Admin account created. They can sign in at /admin/login.",
        promoted:
          "Existing user promoted to admin. They can sign in at /admin/login with their current credentials (or the password you set).",
        reactivated: "Admin account reactivated.",
      } as const;
      setInviteSuccess(labels[result.mode] ?? "Admin saved.");
      setInviteForm({ email: "", displayName: "", role: "admin", password: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      setInviteError(error instanceof Error ? error.message : "Invite failed");
    },
  });

  const sortedAdmins = useMemo(
    () =>
      [...(data?.admins ?? [])].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.displayName.localeCompare(b.displayName);
      }),
    [data?.admins]
  );

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load admin users."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {canInvite ? (
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Add admin</h2>
          </div>
          <div className="admin-panel__body">
            <p style={{ margin: "0 0 1rem", color: "var(--admin-muted)", fontSize: "0.875rem" }}>
              Create a new login, or enter an existing storefront email to promote that account.
              Password is required only for brand-new emails.
            </p>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="admin-invite-email">Email</label>
                <input
                  id="admin-invite-email"
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="email"
                  autoComplete="off"
                  placeholder="name@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="admin-invite-name">Display name</label>
                <input
                  id="admin-invite-name"
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={inviteForm.displayName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, displayName: e.target.value })
                  }
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="admin-invite-role">Role</label>
                <select
                  id="admin-invite-role"
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
                <label htmlFor="admin-invite-password">
                  Password{" "}
                  <span style={{ fontWeight: 400, color: "var(--admin-muted)" }}>
                    (required for new emails)
                  </span>
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    id="admin-invite-password"
                    className="admin-input"
                    style={{ width: "100%" }}
                    type={showInvitePassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={inviteForm.password}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setShowInvitePassword((v) => !v)}
                  >
                    {showInvitePassword ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      const password = generateTempPassword();
                      setInviteForm((prev) => ({ ...prev, password }));
                      setShowInvitePassword(true);
                    }}
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
            {inviteError ? (
              <p style={{ color: "var(--admin-danger)", marginTop: "0.75rem" }}>{inviteError}</p>
            ) : null}
            {inviteSuccess ? (
              <p style={{ color: "var(--admin-success, #16a34a)", marginTop: "0.75rem" }}>
                {inviteSuccess}
              </p>
            ) : null}
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              style={{ marginTop: "1rem" }}
              disabled={
                inviteMutation.isPending ||
                !inviteForm.email.trim() ||
                !inviteForm.displayName.trim()
              }
              onClick={() => inviteMutation.mutate()}
            >
              {inviteMutation.isPending ? "Saving…" : "Add admin"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Admin users ({sortedAdmins.length})</h2>
          </div>
          {sortedAdmins.length === 0 ? (
            <EmptyState message="No admin users found." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAdmins.map((admin) => (
                    <tr
                      key={admin.uid}
                      style={{
                        cursor: "pointer",
                        background:
                          selected?.uid === admin.uid
                            ? "var(--admin-surface-2)"
                            : undefined,
                      }}
                      onClick={() => {
                        setSelected(admin);
                        setForm({
                          displayName: admin.displayName,
                          role: admin.role,
                          isActive: admin.isActive,
                          password: "",
                        });
                        setShowResetPassword(false);
                        updateMutation.reset();
                      }}
                    >
                      <td>
                        {admin.displayName}
                        {admin.uid === currentUid ? (
                          <span style={{ color: "var(--admin-muted)", marginLeft: 6 }}>
                            (you)
                          </span>
                        ) : null}
                      </td>
                      <td>{admin.email}</td>
                      <td>{ADMIN_ROLE_LABELS[admin.role]}</td>
                      <td>
                        <span
                          style={{
                            color: admin.isActive
                              ? "var(--admin-success, #16a34a)"
                              : "var(--admin-danger)",
                          }}
                        >
                          {admin.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
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
            ) : !canInvite ? (
              <EmptyState message="You can view admins but need Super Admin rights to edit." />
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
                  <label htmlFor="admin-edit-name">Display name</label>
                  <input
                    id="admin-edit-name"
                    className="admin-input"
                    style={{ width: "100%" }}
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="admin-edit-role">Role</label>
                  <select
                    id="admin-edit-role"
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
                    disabled={selected.uid === currentUid}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active account
                </label>

                <div style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setShowResetPassword((v) => !v)}
                  >
                    {showResetPassword ? "Cancel password reset" : "Reset password"}
                  </button>
                </div>

                {showResetPassword ? (
                  <div className="admin-form-group" style={{ marginTop: "0.75rem" }}>
                    <label htmlFor="admin-edit-password">New password</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        id="admin-edit-password"
                        className="admin-input"
                        style={{ width: "100%" }}
                        type="text"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            password: generateTempPassword(),
                          }))
                        }
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                ) : null}

                {updateMutation.isError ? (
                  <p style={{ color: "var(--admin-danger)", marginTop: "0.75rem" }}>
                    {updateMutation.error instanceof Error
                      ? updateMutation.error.message
                      : "Update failed"}
                  </p>
                ) : null}
                {updateMutation.isSuccess ? (
                  <p
                    style={{
                      color: "var(--admin-success, #16a34a)",
                      marginTop: "0.75rem",
                    }}
                  >
                    Changes saved
                    {updateMutation.data?.passwordUpdated ? " (password updated)" : ""}.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  style={{ marginTop: "1rem" }}
                  disabled={updateMutation.isPending || !form.displayName.trim()}
                  onClick={() => updateMutation.mutate()}
                >
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--admin-muted)" }}>
        New admins sign in at{" "}
        <Link href={ROUTES.adminLogin} style={{ color: "var(--admin-accent)" }}>
          {ROUTES.adminLogin}
        </Link>
        . Role permissions are listed under{" "}
        <Link href={ROUTES.adminRoles} style={{ color: "var(--admin-accent)" }}>
          Roles
        </Link>
        .
      </p>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Admin users">
          {admin.permissions.includes("admins:read") ? (
            <UsersContent
              canInvite={admin.permissions.includes("admins:write")}
              currentUid={admin.uid}
            />
          ) : (
            <EmptyState message="Insufficient permissions to view admin users. Sign in as Super Admin." />
          )}
        </AdminShell>
      )}
    </AdminGuard>
  );
}
