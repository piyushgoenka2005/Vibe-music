import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { getOrderById } from "@/lib/server/orderService";
import { verifyInvoiceAccessToken } from "@/lib/security/invoiceAccessToken";
import type { Order } from "@/types/order";
import { InvoiceToolbar } from "@/features/invoice/ui/InvoiceToolbar";
import { isInvoicePdfEnabled } from "@/features/invoice/server/resolveInvoiceOrder";
import "@/components/checkout/checkout.css";

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

  let order: Order | null = null;

  if (token && verifyInvoiceAccessToken(token, orderId, email)) {
    order = await getOrderById(orderId);
  } else if (email) {
    const fetched = await getOrderById(orderId);
    if (fetched && fetched.email.toLowerCase() === email) {
      order = fetched;
    }
  } else {
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      const adminSession = await getAdminSession(sessionUser.uid);
      const fetched = await getOrderById(orderId);
      if (fetched) {
        const owns =
          Boolean(adminSession) ||
          fetched.userId === sessionUser.uid ||
          (sessionUser.email &&
            fetched.email.toLowerCase() === sessionUser.email.toLowerCase());
        order = owns ? fetched : null;
      }
    }
  }

  let invoiceUrl = `/orders/${encodeURIComponent(orderId)}/invoice`;
  let frameSrc = `/api/invoices/${encodeURIComponent(orderId)}/html`;

  if (token) {
    invoiceUrl = appendQueryParam(invoiceUrl, "token", token);
    frameSrc = appendQueryParam(frameSrc, "token", token);
  } else if (email) {
    invoiceUrl = appendQueryParam(invoiceUrl, "email", email);
    frameSrc = appendQueryParam(frameSrc, "email", email);
  }

  const pdfSrc = frameSrc.replace("/html", "/pdf");
  const pdfEnabled = isInvoicePdfEnabled();

  if (!order) {
    return (
      <main className="storefront-page storefront-page--subtle">
        <h1 className="storefront-h1">Invoice unavailable</h1>
        <p>Order not found or not accessible.</p>
      </main>
    );
  }

  return (
    <main className="storefront-page storefront-page--subtle">
      <div className="storefront-page__inner">
        <h1 className="storefront-h1">Tax Invoice</h1>

        <InvoiceToolbar
          order={order}
          invoiceUrl={invoiceUrl}
          pdfUrl={pdfEnabled ? pdfSrc : undefined}
          htmlPrintUrl={`${frameSrc}${frameSrc.includes("?") ? "&" : "?"}print=1`}
        />

        <div className="invoice-frame-wrap">
          <iframe
            title={`Invoice ${order.invoice?.invoiceNumber ?? ""}`}
            className="invoice-frame"
            src={frameSrc}
          />
        </div>
      </div>
    </main>
  );
}
