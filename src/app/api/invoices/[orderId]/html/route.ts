import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { getOrderById } from "@/lib/server/orderService";
import type { Order } from "@/types/order";
import { getInvoiceSellerMeta } from "@/features/invoice/server/sellerMeta";
import { generateInvoiceHtml } from "@/features/invoice/server/generateInvoiceHtml";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const { searchParams } = new URL(_request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    let order: Order | null = null;

    // Guest flow: validate order belongs to the provided email.
    if (email) {
      const db = getAdminFirestore();
      const doc = await db.collection("orders").doc(orderId).get();
      if (!doc.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      order = { id: doc.id, ...doc.data() } as Order;
      if (order.email.toLowerCase() !== email) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    } else {
      // Auth flow.
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

    // Invoice should only be generated after payment confirmation.
    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Invoice not available before payment confirmation" },
        { status: 403 }
      );
    }

    if (!order.invoice) {
      return NextResponse.json({ error: "Invoice data missing" }, { status: 404 });
    }

    const seller = await getInvoiceSellerMeta();
    const html = generateInvoiceHtml(order, seller);

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to generate invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

