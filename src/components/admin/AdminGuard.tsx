"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminSessionBootstrap } from "@/components/admin/AdminSessionBootstrap";
import { canAccessAdminPath } from "@/lib/auth/admin-route-permissions";
import { ROUTES } from "@/lib/routes";
import AuthLoading from "@/components/auth/AuthLoading";
import { safeReadApiResponse } from "@/lib/admin/adminFetch";
import type { AdminSession } from "@/types/admin";

const SESSION_STORAGE_KEY = "vibe_admin_session";

function getCachedAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.uid === "string" && Array.isArray(parsed.permissions)) {
      return parsed as AdminSession;
    }
  } catch {
    /* ignore session storage parse error */
  }
  return null;
}

export function setCachedAdminSession(session: AdminSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
}

async function fetchAdminSession(): Promise<AdminSession | null> {
  const res = await fetch("/api/admin/me");
  if (res.status === 401 || res.status === 403) {
    setCachedAdminSession(null);
    return null;
  }
  const parsed = await safeReadApiResponse<{ admin?: AdminSession }>(res);
  if (!parsed.ok || !parsed.data?.admin) {
    throw new Error(parsed.error ?? "Failed to verify admin session");
  }
  setCachedAdminSession(parsed.data.admin);
  return parsed.data.admin;
}

export function useAdminSession() {
  const bootstrap = useAdminSessionBootstrap();
  const cached = bootstrap ?? getCachedAdminSession();
  return useQuery({
    queryKey: ["admin-session"],
    queryFn: fetchAdminSession,
    retry: false,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Server layout or sessionStorage already resolved the session — paint immediately with zero delay
    initialData: cached ?? undefined,
    initialDataUpdatedAt: cached ? Number.MAX_SAFE_INTEGER : undefined,
  });
}

interface AdminGuardProps {
  children: (admin: AdminSession) => React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: admin, isLoading, isError, isFetched } = useAdminSession();

  useEffect(() => {
    if (isLoading) return;
    // Only redirect after a real fetch miss (or bootstrap null with fetch done).
    if (!admin && (isFetched || admin === null)) {
      router.replace(`${ROUTES.adminLogin}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [admin, isLoading, isFetched, pathname, router]);

  if (isLoading && !admin) {
    return (
      <div className="admin-root">
        <div className="admin-loading">Verifying admin access…</div>
      </div>
    );
  }

  if (!admin || isError) {
    return <AuthLoading />;
  }

  if (
    admin.role !== "super_admin" &&
    !canAccessAdminPath(admin.permissions, pathname, admin.role)
  ) {
    return (
      <AdminShell admin={admin} title="Access denied">
        <div className="admin-panel">
          <div className="admin-panel__body" role="alert">
            <p style={{ margin: "0 0 1rem" }}>You do not have permission to view this page.</p>
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
