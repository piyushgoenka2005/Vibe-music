import { NextResponse } from "next/server";
import { getRentalBookingById } from "@/lib/server/rentalRepository";
import { formatRentalDateRange } from "@/lib/rental/durationUtils";

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

    const items = booking.items
      .map(
        (item) =>
          `<tr><td>${item.productName}</td><td>${item.quantity}</td><td>₹${item.lineSubtotal.toFixed(2)}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Rental Invoice ${booking.bookingNumber}</title>
<style>body{font-family:Arial,sans-serif;max-width:720px;margin:2rem auto;color:#111}
table{width:100%;border-collapse:collapse;margin-top:1rem}td,th{border:1px solid #ddd;padding:8px;text-align:left}
h1{font-size:1.4rem}</style></head>
<body>
<h1>Vibe Music — Rental Invoice</h1>
<p><strong>Booking:</strong> ${booking.bookingNumber}</p>
<p><strong>Customer:</strong> ${booking.customerName} (${booking.email})</p>
<p><strong>Period:</strong> ${formatRentalDateRange(booking.startAt, booking.endAt)}</p>
<p><strong>Fulfillment:</strong> ${booking.fulfillment}</p>
<table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${items}</tbody></table>
<p>Subtotal: ₹${booking.subtotal.toFixed(2)}</p>
<p>Deposit: ₹${booking.depositAmount.toFixed(2)}</p>
<p>GST (included): ₹${booking.totalGst.toFixed(2)}</p>
<p><strong>Total: ₹${booking.total.toFixed(2)}</strong></p>
<p>Status: ${booking.status} · Payment: ${booking.paymentStatus}</p>
</body></html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invoice failed" },
      { status: 500 }
    );
  }
}
