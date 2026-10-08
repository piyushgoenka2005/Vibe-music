import { redirect } from "next/navigation";
import { getLoginRedirectUrl } from "@/lib/auth/protected-routes";
import { withServerPageError } from "@/lib/serverPageError";
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
  return withServerPageError(async () => {
    const { orderId } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const email = resolvedSearchParams?.email?.trim().toLowerCase();
    const token = resolvedSearchParams?.token?.trim();
    const returnTo = resolvedSearchParams?.returnTo?.trim();

    const hasGuestAccess =
      Boolean(token && verifyInvoiceAccessToken(token, orderId, email)) || Boolean(email);
    const sessionUser = hasGuestAccess ? null : await getSessionUser();

    if (!hasGuestAccess && !sessionUser) {
      const returnPath = `/orders/${encodeURIComponent(orderId)}/invoice`;
      redirect(getLoginRedirectUrl(returnPath));
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
  }, "Invoice");
}
