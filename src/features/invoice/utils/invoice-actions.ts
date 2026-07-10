import type { InvoiceUrls } from "@/features/invoice/types";

export function isClientInvoicePdfEnabled(): boolean {
  return process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED === "true";
}

export function getInvoiceDownloadAction(
  invoiceUrls: InvoiceUrls | null | undefined
): { href: string; label: string } | null {
  if (!invoiceUrls) return null;

  if (isClientInvoicePdfEnabled() && invoiceUrls.pdf) {
    return { href: invoiceUrls.pdf, label: "Download PDF" };
  }

  if (invoiceUrls.print) {
    return { href: invoiceUrls.print, label: "Print invoice" };
  }

  return invoiceUrls.html
    ? { href: invoiceUrls.html, label: "View invoice" }
    : null;
}
