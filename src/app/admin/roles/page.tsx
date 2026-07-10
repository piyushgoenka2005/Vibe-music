"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/admin/AdminUi";
import {
  ADMIN_ROLE_LABELS,
  getPermissionsForRole,
} from "@/lib/auth/permissions";
import type { AdminRole, Permission } from "@/types/admin";

const ALL_PERMISSIONS: Permission[] = [
  "dashboard:read",
  "products:read",
  "products:write",
  "products:delete",
  "categories:read",
  "categories:write",
  "categories:delete",
  "orders:read",
  "orders:write",
  "orders:refund",
  "customers:read",
  "customers:write",
  "coupons:read",
  "coupons:write",
  "coupons:delete",
  "reviews:read",
  "reviews:write",
  "inventory:read",
  "inventory:write",
  "analytics:read",
  "settings:read",
  "settings:write",
  "banners:read",
  "banners:write",
  "banners:delete",
  "homepage:read",
  "homepage:write",
  "blog:read",
  "blog:write",
  "blog:delete",
  "admins:read",
  "admins:write",
  "audit:read",
];

const ROLES = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[];

function RolesContent() {
  return (
    <div className="admin-panel">
      <p style={{ marginBottom: "1rem", color: "var(--admin-muted)" }}>
        Built-in roles and their permissions. Assign roles from Admin users.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Permission</th>
              {ROLES.map((role) => (
                <th key={role}>{ADMIN_ROLE_LABELS[role]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((permission) => (
              <tr key={permission}>
                <td>{permission}</td>
                {ROLES.map((role) => (
                  <td key={role}>
                    {getPermissionsForRole(role).includes(permission) ? "✓" : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminRolesPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Roles & permissions">
          {admin.permissions.includes("admins:read") ? (
            <RolesContent />
          ) : (
            <EmptyState message="Insufficient permissions." />
          )}
        </AdminShell>
      )}
    </AdminGuard>
  );
}
