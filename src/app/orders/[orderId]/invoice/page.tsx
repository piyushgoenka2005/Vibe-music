import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { getOrderById } from "@/lib/server/orderService";
import type { Order } from "@/types/order";
import { InvoiceToolbar } from "@/features/invoice/ui/InvoiceToolbar";
import "@/components/checkout/checkout.css";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams?: { email?: string };
}) {
  const { orderId } = params;
  const email = searchParams?.email?.trim().toLowerCase();

  let order: Order | null = null;

  if (email) {
    const db = getAdminFirestore();
    const doc = await db.collection("orders").doc(orderId).get();
    if (doc.exists) {
      order = { id: doc.id, ...doc.data() } as Order;
      if (order.email.toLowerCase() !== email) order = null;
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

  const invoiceUrl = email
    ? `/orders/${encodeURIComponent(orderId)}/invoice?email=${encodeURIComponent(email)}`
    : `/orders/${encodeURIComponent(orderId)}/invoice`;

  const frameSrc = email
    ? `/api/invoices/${encodeURIComponent(orderId)}/html?email=${encodeURIComponent(email)}`
    : `/api/invoices/${encodeURIComponent(orderId)}/html`;

  const pdfSrc = frameSrc.replace("/html", "/pdf");
  const pdfEnabled =
    process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED === "true" ||
    process.env.INVOICE_PDF_ENABLED === "true";

  if (!order) {
    return (
      <main className="storefront-page storefront-page--subtle" id="main-content">
        <h1 className="storefront-h1">Invoice unavailable</h1>
        <p>Order not found or not accessible.</p>
      </main>
    );
  }

  return (
    <main className="storefront-page storefront-page--subtle" id="main-content">
      <div className="storefront-page__inner">
        <h1 className="storefront-h1">Tax Invoice</h1>

        <InvoiceToolbar
          order={order}
          invoiceUrl={invoiceUrl}
          pdfUrl={pdfEnabled ? pdfSrc : undefined}
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

