import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getInvoiceSellerMeta } from "@/features/invoice/server/sellerMeta";
import { generateInvoiceHtml } from "@/features/invoice/server/generateInvoiceHtml";
import {
  invoiceOrderErrorStatus,
  isInvoicePdfEnabled,
  resolveInvoiceOrder,
} from "@/features/invoice/server/resolveInvoiceOrder";

async function loadPuppeteer(): Promise<{
  launch: (options: { args: string[] }) => Promise<{
    newPage: () => Promise<{
      setContent: (html: string, options: { waitUntil: string }) => Promise<void>;
      pdf: (options: { format: string; printBackground: boolean }) => Promise<Buffer>;
    }>;
    close: () => Promise<void>;
  }>;
} | null> {
  try {
    // Optional dependency — avoid static resolution when puppeteer is not installed.
    const puppeteerName = "puppeteer";
    return (0, eval)(`require("${puppeteerName}")`);
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const rateLimited = await enforceRateLimit(
    request,
    "invoice-pdf",
    RATE_LIMITS.sensitiveAccess
  );
  if (rateLimited) return rateLimited;

  try {
    const { orderId } = await context.params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() ?? undefined;
    const token = searchParams.get("token")?.trim() ?? undefined;

    if (!isInvoicePdfEnabled()) {
      return NextResponse.json(
        { error: "PDF generation not enabled" },
        { status: 501 }
      );
    }

    const resolved = await resolveInvoiceOrder(orderId, email, token);
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.message },
        { status: invoiceOrderErrorStatus(resolved.code) }
      );
    }

    const puppeteerModule = await loadPuppeteer();
    if (!puppeteerModule) {
      const printUrl = new URL(request.url);
      printUrl.pathname = printUrl.pathname.replace(/\/pdf\/?$/, "/html");
      printUrl.searchParams.set("print", "1");
      if (token) printUrl.searchParams.set("token", token);
      return NextResponse.redirect(printUrl);
    }

    const seller = await getInvoiceSellerMeta();
    const html = generateInvoiceHtml(resolved.order, seller);

    const browser = await puppeteerModule.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      const pdfBytes = new Uint8Array(pdfBuffer);
      return new NextResponse(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="invoice-${orderId}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to generate PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
