"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminSession } from "@/types/admin";

const AdminSessionBootstrapContext = createContext<AdminSession | null | undefined>(undefined);

/** Server-resolved admin session for first paint (avoids /api/admin/me waterfall). */
export function AdminSessionBootstrapProvider({
  initialAdmin,
  children,
}: {
  initialAdmin: AdminSession | null;
  children: ReactNode;
}) {
  return (
    <AdminSessionBootstrapContext.Provider value={initialAdmin}>
      {children}
    </AdminSessionBootstrapContext.Provider>
  );
}

export function useAdminSessionBootstrap(): AdminSession | null | undefined {
  return useContext(AdminSessionBootstrapContext);
}
