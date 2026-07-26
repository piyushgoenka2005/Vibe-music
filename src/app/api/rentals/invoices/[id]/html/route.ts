import { NextResponse } from "next/server";
import { getRentalBookingById } from "@/lib/server/rentalRepository";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { formatRentalDateRange } from "@/lib/rental/durationUtils";
import { handleRouteError } from "@/lib/api/route-utils";
import { timingSafeEqual } from "node:crypto";

function verifyToken(
  stored: string | null | undefined,
  provided: string | null
): boolean {
  const a = stored?.trim();
  const b = provided?.trim();
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const booking = await getRentalBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const isOwner = Boolean(sessionUser?.uid && booking.userId === sessionUser.uid);
    const hasToken = verifyToken(booking.trackingToken, token);
    const isAdmin = sessionUser?.uid
      ? Boolean(await getAdminSession(sessionUser.uid))
      : false;

    if (!isOwner && !hasToken && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const items = booking.items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.productName)}</td><td>${item.quantity}</td><td>₹${item.lineSubtotal.toFixed(2)}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Rental Invoice ${escapeHtml(booking.bookingNumber)}</title>
<style>body{font-family:Arial,sans-serif;max-width:720px;margin:2rem auto;color:#111}
table{width:100%;border-collapse:collapse;margin-top:1rem}td,th{border:1px solid #ddd;padding:8px;text-align:left}
h1{font-size:1.4rem}</style></head>
<body>
<h1>Vibe Music — Rental Invoice</h1>
<p><strong>Booking:</strong> ${escapeHtml(booking.bookingNumber)}</p>
<p><strong>Customer:</strong> ${escapeHtml(booking.customerName)} (${escapeHtml(booking.email)})</p>
<p><strong>Period:</strong> ${escapeHtml(formatRentalDateRange(booking.startAt, booking.endAt))}</p>
<p><strong>Fulfillment:</strong> ${escapeHtml(booking.fulfillment)}</p>
<table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${items}</tbody></table>
<p>Subtotal: ₹${booking.subtotal.toFixed(2)}</p>
<p>Deposit: ₹${booking.depositAmount.toFixed(2)}</p>
<p>GST (included): ₹${booking.totalGst.toFixed(2)}</p>
<p><strong>Total: ₹${booking.total.toFixed(2)}</strong></p>
<p>Status: ${escapeHtml(booking.status)} · Payment: ${escapeHtml(booking.paymentStatus)}</p>
</body></html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/rentals/invoices/[id]/html");
  }
}
