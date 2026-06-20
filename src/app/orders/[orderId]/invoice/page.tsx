import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { getOrderById } from "@/lib/server/orderService";
import { verifyInvoiceAccessToken } from "@/lib/security/invoiceAccessToken";

function appendQueryParam(url: string, key: string, value: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${key}=${encodeURIComponent(value)}`;
}

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ email?: string; token?: string }>;
}) {
  const { orderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const email = resolvedSearchParams?.email?.trim().toLowerCase();
  const token = resolvedSearchParams?.token?.trim();

  let allowed = false;

  if (token && verifyInvoiceAccessToken(token, orderId, email)) {
    allowed = true;
  } else if (email) {
    const fetched = await getOrderById(orderId);
    allowed = Boolean(fetched && fetched.email.toLowerCase() === email);
  } else {
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      const adminSession = await getAdminSession(sessionUser.uid);
      const fetched = await getOrderById(orderId);
      if (fetched) {
        allowed =
          Boolean(adminSession) ||
          fetched.userId === sessionUser.uid ||
          Boolean(
            sessionUser.email &&
              fetched.email.toLowerCase() === sessionUser.email.toLowerCase()
          );
      }
    }
  }

  if (!allowed) {
    return (
      <main className="storefront-page storefront-page--subtle">
        <div className="storefront-page__inner">
          <h1 className="storefront-h1">Invoice unavailable</h1>
          <p>Order not found or not accessible.</p>
        </div>
      </main>
    );
  }

  let htmlUrl = `/api/invoices/${encodeURIComponent(orderId)}/html`;

  if (token) {
    htmlUrl = appendQueryParam(htmlUrl, "token", token);
  } else if (email) {
    htmlUrl = appendQueryParam(htmlUrl, "email", email);
  }

  redirect(htmlUrl);
}
