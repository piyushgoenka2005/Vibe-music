import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { getOrderById } from "@/lib/server/orderService";
import type { Order } from "@/types/order";
import { getInvoiceSellerMeta } from "@/features/invoice/server/sellerMeta";
import { generateInvoiceHtml } from "@/features/invoice/server/generateInvoiceHtml";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() ?? undefined;

    const pdfEnabled =
      process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED === "true" ||
      process.env.INVOICE_PDF_ENABLED === "true";

    if (!pdfEnabled) {
      return NextResponse.json(
        { error: "PDF generation not enabled" },
        { status: 501 }
      );
    }

    let order: Order | null = null;
    if (email) {
      const db = getAdminFirestore();
      const doc = await db.collection("orders").doc(orderId).get();
      if (!doc.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      order = { id: doc.id, ...doc.data() } as Order;
      if (order.email.toLowerCase() !== email) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    } else {
      const sessionUser = await getSessionUser();
      if (!sessionUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      const adminSession = await getAdminSession(sessionUser.uid);
      order = await getOrderById(orderId);
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      if (!adminSession) {
        const owns =
          order.userId === sessionUser.uid ||
          (sessionUser.email &&
            order.email.toLowerCase() === sessionUser.email.toLowerCase());
        if (!owns) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Invoice not available before payment confirmation" },
        { status: 403 }
      );
    }

    if (!order.invoice) {
      return NextResponse.json({ error: "Invoice data missing" }, { status: 404 });
    }

    // Optional dependency: do not hard-require puppeteer types.
    // If puppeteer isn't installed, we return a graceful 501.
    let puppeteer: any;
    try {
      // Next/Turbopack may try to statically resolve `require("puppeteer")`.
      // Use an indirect require so PDF remains optional and dependency-light.
      const puppeteerName = "puppeteer";
      // eslint-disable-next-line no-eval
      puppeteer = (0, eval)("require")(puppeteerName);
    } catch {
      return NextResponse.json(
        { error: "puppeteer not installed" },
        { status: 501 }
      );
    }

    const seller = await getInvoiceSellerMeta();
    const html = generateInvoiceHtml(order, seller);

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer: Buffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    await browser.close();

    const pdfBytes = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=\"invoice-${orderId}.pdf\"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to generate PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

