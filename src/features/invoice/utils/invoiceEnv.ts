/** Client-safe check for invoice PDF download availability. */
export function isInvoicePdfEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED === "true";
}
