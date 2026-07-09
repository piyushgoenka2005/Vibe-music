import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getInvoiceSellerMeta } from "@/features/invoice/server/sellerMeta";
import { generateInvoiceHtml } from "@/features/invoice/server/generateInvoiceHtml";
import { generateInvoicePdf } from "@/features/invoice/server/generateInvoicePdf";
import { buildInvoiceDownloadFilename } from "@/features/invoice/server/invoiceUrls";
import {
  invoiceOrderErrorStatus,
  resolveInvoiceOrder,
} from "@/features/invoice/server/resolveInvoiceOrder";

function buildPrintFallbackUrl(requestUrl: string): string {
  const printUrl = new URL(requestUrl);
  printUrl.pathname = printUrl.pathname.replace(/\/pdf\/?$/, "/html");
  printUrl.searchParams.set("print", "1");
  return printUrl.toString();
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

    const resolved = await resolveInvoiceOrder(orderId, email, token);
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.message },
        { status: invoiceOrderErrorStatus(resolved.code) }
      );
    }

    const seller = await getInvoiceSellerMeta();
    const html = generateInvoiceHtml(resolved.order, seller, {
      showActions: false,
    });

    const pdfBuffer = await generateInvoicePdf(html);
    if (!pdfBuffer) {
      return NextResponse.redirect(buildPrintFallbackUrl(request.url));
    }

    const filename = buildInvoiceDownloadFilename(resolved.order);
    const pdfBytes = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to generate PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
