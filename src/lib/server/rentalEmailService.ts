import "server-only";

import type { RentalBooking } from "@/types/rental";
import { sendMail } from "@/lib/server/email/smtp";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { logInfo } from "@/lib/server/logger";
import { formatRentalDateRange } from "@/lib/rental/durationUtils";

type RentalEmailEvent = "confirmed" | "cancelled" | "returned" | "reminder";

function subjectFor(event: RentalEmailEvent, booking: RentalBooking): string {
  switch (event) {
    case "confirmed":
      return `Rental confirmed — ${booking.bookingNumber}`;
    case "cancelled":
      return `Rental cancelled — ${booking.bookingNumber}`;
    case "returned":
      return `Rental returned — ${booking.bookingNumber}`;
    case "reminder":
      return `Rental reminder — ${booking.bookingNumber}`;
    default:
      return `Rental update — ${booking.bookingNumber}`;
  }
}

function bodyFor(event: RentalEmailEvent, booking: RentalBooking): string {
  const items = booking.items.map((i) => `• ${i.productName} × ${i.quantity}`).join("\n");
  const range = formatRentalDateRange(booking.startAt, booking.endAt);
  const base = [
    `Hello ${booking.customerName},`,
    "",
    `Booking: ${booking.bookingNumber}`,
    `Status: ${booking.status}`,
    `Period: ${range}`,
    `Fulfillment: ${booking.fulfillment}`,
    "",
    "Items:",
    items,
    "",
    `Total: ₹${booking.total.toFixed(2)} (includes deposit ₹${booking.depositAmount.toFixed(2)})`,
    "",
  ];

  if (event === "confirmed") {
    base.push(
      "Your rental is confirmed. Please bring a valid ID for pickup or ensure someone is available for delivery.",
      "",
      "Thank you for choosing Vibe Music."
    );
  } else if (event === "cancelled") {
    base.push(
      booking.cancellationReason
        ? `Reason: ${booking.cancellationReason}`
        : "This rental booking was cancelled.",
      booking.refundAmount > 0
        ? `Refund amount: ₹${booking.refundAmount.toFixed(2)}`
        : "",
      "",
      "Contact support if you have questions."
    );
  } else if (event === "returned") {
    base.push(
      booking.lateFees > 0 ? `Late fees: ₹${booking.lateFees.toFixed(2)}` : "",
      booking.damageCharges > 0
        ? `Damage charges: ₹${booking.damageCharges.toFixed(2)}`
        : "",
      "",
      "Thank you for returning your rental gear."
    );
  } else {
    base.push("This is a reminder about your upcoming rental with Vibe Music.");
  }

  return base.filter(Boolean).join("\n");
}

export async function sendRentalBookingEmail(
  booking: RentalBooking,
  event: RentalEmailEvent
): Promise<void> {
  try {
    await sendMail({
      from: formatMailboxFrom("orders"),
      to: booking.email,
      subject: subjectFor(event, booking),
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${bodyFor(event, booking)}</pre>`,
      text: bodyFor(event, booking),
    });
  } catch (error) {
    logInfo("Rental email failed", "rental-email", {
      bookingId: booking.id,
      event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
