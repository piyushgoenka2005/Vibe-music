import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getInvoiceSellerMeta } from "@/features/invoice/server/sellerMeta";
import { generateInvoiceHtml } from "@/features/invoice/server/generateInvoiceHtml";
import { buildInvoiceUrls } from "@/features/invoice/server/invoiceUrls";
import {
  invoiceOrderErrorStatus,
  resolveInvoiceOrder,
} from "@/features/invoice/server/resolveInvoiceOrder";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const rateLimited = await enforceRateLimit(
    request,
    "invoice-html",
    RATE_LIMITS.sensitiveAccess
  );
  if (rateLimited) return rateLimited;

  try {
    const { orderId } = await context.params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() ?? undefined;
    const token = searchParams.get("token")?.trim() ?? undefined;
    const autoPrint = searchParams.get("print") === "1";
    const returnTo = searchParams.get("returnTo")?.trim() ?? undefined;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const resolved = await resolveInvoiceOrder(orderId, email, token);
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.message },
        { status: invoiceOrderErrorStatus(resolved.code) }
      );
    }

    const seller = await getInvoiceSellerMeta();
    const invoiceUrls = buildInvoiceUrls(resolved.order);
    const html = generateInvoiceHtml(resolved.order, seller, {
      autoPrint,
      showActions: true,
      downloadUrl: invoiceUrls?.pdf,
      returnTo,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to generate invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
