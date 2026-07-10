import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server-session";
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
  searchParams?: Promise<{ email?: string; token?: string; returnTo?: string }>;
}) {
  const { orderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const email = resolvedSearchParams?.email?.trim().toLowerCase();
  const token = resolvedSearchParams?.token?.trim();
  const returnTo = resolvedSearchParams?.returnTo?.trim();

  const hasGuestAccess =
    Boolean(token && verifyInvoiceAccessToken(token, orderId, email)) ||
    Boolean(email);
  const sessionUser = hasGuestAccess ? null : await getSessionUser();

  if (!hasGuestAccess && !sessionUser) {
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

  if (returnTo) {
    htmlUrl = appendQueryParam(htmlUrl, "returnTo", returnTo);
  }

  redirect(htmlUrl);
}
