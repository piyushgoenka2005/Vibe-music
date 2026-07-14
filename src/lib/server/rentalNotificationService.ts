import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { RentalBooking } from "@/types/rental";
import { logInfo } from "@/lib/server/logger";

export async function notifyRentalBookingUpdate(
  booking: RentalBooking,
  status: string
): Promise<void> {
  const title =
    status === "confirmed"
      ? "Rental confirmed"
      : status === "cancelled"
        ? "Rental cancelled"
        : status === "completed"
          ? "Rental completed"
          : "Rental update";

  const body = `Booking ${booking.bookingNumber} is now ${status}.`;

  try {
    if (booking.userId) {
      await prisma.userNotification.create({
        data: {
          id: randomUUID(),
          userId: booking.userId,
          type: "rental",
          title,
          body,
          link: `/account/rentals/${booking.id}`,
          read: false,
          createdAt: new Date().toISOString(),
        },
      });
    }

    await prisma.adminNotification.create({
      data: {
        id: randomUUID(),
        type: "rental",
        title,
        body,
        link: `/admin/rentals/bookings/${booking.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logInfo("Rental notification failed", "rental-notify", {
      bookingId: booking.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
