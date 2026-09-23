import "@/components/admin/admin.css";
import "@/styles/admin-redesign.css";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { AdminSessionBootstrapProvider } from "@/components/admin/AdminSessionBootstrap";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Resolve admin once on the server so client pages skip the /api/admin/me wait.
  let initialAdmin = null;
  try {
    const user = await getSessionUser();
    if (user) {
      initialAdmin = await getAdminSession(user.uid);
    }
  } catch {
    initialAdmin = null;
  }

  return (
    <AdminSessionBootstrapProvider initialAdmin={initialAdmin}>
      {children}
    </AdminSessionBootstrapProvider>
  );
}
