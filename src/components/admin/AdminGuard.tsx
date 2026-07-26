"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import { canAccessAdminPath } from "@/lib/auth/admin-route-permissions";
import { ROUTES } from "@/lib/routes";
import AuthLoading from "@/components/auth/AuthLoading";
import type { AdminSession } from "@/types/admin";

async function fetchAdminSession(): Promise<AdminSession | null> {
  const res = await fetch("/api/admin/me");
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error("Failed to verify admin session");
  const data = (await res.json()) as { admin: AdminSession };
  return data.admin;
}

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin-session"],
    queryFn: fetchAdminSession,
    retry: false,
    staleTime: 60_000,
  });
}

interface AdminGuardProps {
  children: (admin: AdminSession) => React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: admin, isLoading, isError } = useAdminSession();

  useEffect(() => {
    if (isLoading) return;
    if (!admin) {
      router.replace(`${ROUTES.adminLogin}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [admin, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="admin-root">
        <div className="admin-loading">Verifying admin access…</div>
      </div>
    );
  }

  if (!admin || isError) {
    return <AuthLoading />;
  }

  if (!canAccessAdminPath(admin.permissions, pathname)) {
    return (
      <AdminShell admin={admin} title="Access denied">
        <div className="admin-panel">
          <div className="admin-panel__body" role="alert">
            <p style={{ margin: "0 0 1rem" }}>
              You do not have permission to view this page.
            </p>
            <Link href={ROUTES.admin} className="admin-btn admin-btn--primary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  return <>{children(admin)}</>;
}
