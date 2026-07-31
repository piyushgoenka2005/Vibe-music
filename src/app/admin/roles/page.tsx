"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { ADMIN_ROLE_LABELS, ALL_PERMISSIONS } from "@/lib/auth/permissions";
import type { AdminRole, Permission } from "@/types/admin";

type MatrixResponse = {
  defaults: Record<AdminRole, Permission[]>;
  overrides: Partial<Record<AdminRole, Permission[]>>;
  effective: Record<AdminRole, Permission[]>;
  editableRoles: AdminRole[];
  allPermissions: Permission[];
};

const ROLES = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[];

function RolesContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching, error } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error("Failed to load roles");
      return res.json() as Promise<MatrixResponse>;
    },
  });

  const [draft, setDraft] = useState<Partial<Record<AdminRole, Permission[]>>>({});
  const [selectedRole, setSelectedRole] = useState<AdminRole>("admin");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setDraft(
      Object.fromEntries(
        data.editableRoles.map((role) => [role, [...(data.effective[role] ?? [])]])
      )
    );
  }, [data]);

  const permissions = data?.allPermissions ?? ALL_PERMISSIONS;
  const editable = useMemo(
    () => new Set(data?.editableRoles ?? []),
    [data?.editableRoles]
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      role: AdminRole;
      permissions?: Permission[];
      reset?: boolean;
    }) => {
      const res = await fetch("/api/admin/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      return json;
    },
    onSuccess: async () => {
      setMessage("Role permissions saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (err) =>
      setMessage(err instanceof Error ? err.message : "Save failed"),
  });

  if (isLoading) {
    return <LoadingState message="Loading roles…" />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Unable to load role permissions."
        }
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const activePerms = new Set(draft[selectedRole] ?? data.effective[selectedRole] ?? []);

  return (
    <div className="admin-panel">
      <p style={{ marginBottom: "1rem", color: "var(--admin-muted)" }}>
        Super Admin is fixed. Other roles can be customized; assign roles from Admin users.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            className={`acct__btn ${selectedRole === role ? "acct__btn--primary" : "acct__btn--secondary"}`}
            onClick={() => setSelectedRole(role)}
          >
            {ADMIN_ROLE_LABELS[role]}
            {data.overrides[role] ? " *" : ""}
          </button>
        ))}
      </div>

      {message ? (
        <p style={{ marginBottom: "0.75rem" }} role="status">
          {message}
        </p>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>{ADMIN_ROLE_LABELS[selectedRole]}</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => {
              const isDefault = data.defaults[selectedRole]?.includes(permission);
              const checked = activePerms.has(permission);
              const canEdit = canWrite && editable.has(selectedRole);
              return (
                <tr key={permission}>
                  <td>{permission}</td>
                  <td>
                    {canEdit ? (
                      <input
                        type="checkbox"
                        checked={checked}
                        aria-label={`${permission} for ${selectedRole}`}
                        onChange={(e) => {
                          setDraft((prev) => {
                            const current = new Set(prev[selectedRole] ?? []);
                            if (e.target.checked) current.add(permission);
                            else current.delete(permission);
                            return { ...prev, [selectedRole]: Array.from(current) };
                          });
                        }}
                      />
                    ) : checked ? (
                      "✓"
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{isDefault ? "✓" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canWrite && editable.has(selectedRole) ? (
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            type="button"
            className="acct__btn acct__btn--primary"
            disabled={saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                role: selectedRole,
                permissions: draft[selectedRole] ?? [],
              })
            }
          >
            {saveMutation.isPending ? "Saving…" : "Save role"}
          </button>
          <button
            type="button"
            className="acct__btn acct__btn--secondary"
            disabled={saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({ role: selectedRole, reset: true })
            }
          >
            Reset to defaults
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminRolesPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Roles & permissions">
          {admin.permissions.includes("admins:read") ? (
            <RolesContent canWrite={admin.permissions.includes("admins:write")} />
          ) : (
            <EmptyState message="Insufficient permissions." />
          )}
        </AdminShell>
      )}
    </AdminGuard>
  );
}
