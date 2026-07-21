import "server-only";

import { randomUUID } from "node:crypto";
import Razorpay from "razorpay";
import { isDemoPaymentsAllowed, isRazorpayConfigured } from "@/lib/server/env";
import { toPaise } from "@/lib/gstCalculator";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay/signature";
import { isProductAvailable } from "@/lib/rental/availabilityEngine";
import {
  calculateRentalLine,
  calculateRentalTotals,
  calculateLateFee,
} from "@/lib/rental/pricingEngine";
import { validateDurationBounds } from "@/lib/rental/durationUtils";
import { generateRentalTrackingToken } from "@/lib/rental/bookingNumber";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  addRentalCharge,
  allocateNextRentalBookingNumber,
  appendRentalStatusEvent,
  confirmInventoryLocksForBooking,
  createInventoryLocks,
  createRentalBookingRecord,
  getRentalBookingById,
  getRentalProductById,
  getRentalProductBySlug,
  listRentalBlocksForProduct,
  listRentalLocksForProduct,
  releaseInventoryLocksForBooking,
  updateRentalBookingFields,
} from "@/lib/server/rentalRepository";
import { sendRentalBookingEmail } from "@/lib/server/rentalEmailService";
import { notifyRentalBookingUpdate } from "@/lib/server/rentalNotificationService";
import type {
  CreateRentalBookingPayload,
  RentalQuoteInput,
  RentalQuoteResult,
} from "@/types/rental";

const LOCK_HOLD_MINUTES = 20;

function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function canUseDemoPayments(): boolean {
  return isDemoPaymentsAllowed() && !isRazorpayConfigured();
}

async function resolveProduct(input: RentalQuoteInput) {
  if (input.productId) {
    const product = await getRentalProductById(input.productId);
    if (!product) throw new Error("Rental product not found");
    return product;
  }
  if (input.productSlug) {
    const product = await getRentalProductBySlug(input.productSlug);
    if (!product) throw new Error("Rental product not found");
    return product;
  }
  throw new Error("Product id or slug is required");
}

export async function quoteRentalItem(
  input: RentalQuoteInput
): Promise<RentalQuoteResult> {
  const product = await resolveProduct(input);
  const quantity = Math.max(1, input.quantity ?? 1);

  validateDurationBounds({
    durationType: input.durationType,
    startAt: input.startAt,
    endAt: input.endAt,
    minDurationHours: product.minDurationHours,
    maxDurationDays: product.maxDurationDays,
  });

  if (input.fulfillment === "delivery" && !product.deliveryAvailable) {
    throw new Error("Delivery is not available for this item");
  }
  if (input.fulfillment === "pickup" && !product.pickupAvailable) {
    throw new Error("Pickup is not available for this item");
  }

  const [locks, blocks] = await Promise.all([
    listRentalLocksForProduct(product.id),
    listRentalBlocksForProduct(product.id),
  ]);

  const available = isProductAvailable(
    { product, locks, blocks },
    input.startAt,
    input.endAt,
    quantity
  );

  const line = calculateRentalLine({
    product,
    quantity,
    durationType: input.durationType,
    startAt: input.startAt,
    endAt: input.endAt,
    fulfillment: input.fulfillment,
  });

  const totals = calculateRentalTotals({ lines: [line] });

  return {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    quantity,
    durationType: input.durationType,
    durationUnits: line.durationUnits,
    startAt: input.startAt,
    endAt: input.endAt,
    fulfillment: input.fulfillment,
    unitRate: line.unitRate,
    lineSubtotal: line.lineSubtotal,
    depositAmount: line.depositAmount,
    deliveryFee: line.deliveryFee,
    pickupFee: line.pickupFee,
    subtotal: totals.subtotal,
    totalGst: totals.totalGst,
    total: totals.total,
    available,
    availableUnits: product.availableUnits,
  };
}

export async function createRentalBooking(
  payload: CreateRentalBookingPayload,
  userId?: string
): Promise<{
  booking: Awaited<ReturnType<typeof getRentalBookingById>>;
  razorpayOrderId?: string;
  demoPaymentAllowed?: boolean;
}> {
  if (!payload.termsAccepted || !payload.agreementAccepted) {
    throw new Error("You must accept rental terms and agreement");
  }

  if (!payload.items.length) {
    throw new Error("At least one rental item is required");
  }

  if (payload.fulfillment === "delivery" && !payload.address) {
    throw new Error("Delivery address is required");
  }

  const quotes = await Promise.all(payload.items.map((item) => quoteRentalItem(item)));
  for (const quote of quotes) {
    if (!quote.available) {
      throw new Error(`${quote.productName} is not available for the selected dates`);
    }
  }

  const totals = calculateRentalTotals({
    lines: quotes.map((q) => ({
      lineSubtotal: q.lineSubtotal,
      depositAmount: q.depositAmount,
      deliveryFee: q.deliveryFee,
      pickupFee: q.pickupFee,
    })),
  });

  const bookingId = randomUUID();
  const bookingNumber = await allocateNextRentalBookingNumber();
  const now = new Date().toISOString();
  const startAt = quotes.reduce(
    (min, q) => (q.startAt < min ? q.startAt : min),
    quotes[0]!.startAt
  );
  const endAt = quotes.reduce(
    (max, q) => (q.endAt > max ? q.endAt : max),
    quotes[0]!.endAt
  );
  const durationType = payload.items[0]!.durationType;
  const lockExpires = new Date(Date.now() + LOCK_HOLD_MINUTES * 60 * 1000).toISOString();

  const paymentStatus = "pending";
  const status = "pending";

  await createRentalBookingRecord({
    id: bookingId,
    bookingNumber,
    userId: userId ?? null,
    email: payload.email.trim().toLowerCase(),
    customerName: payload.customerName.trim(),
    customerPhone: payload.customerPhone.trim(),
    isGuest: !userId,
    status,
    paymentStatus,
    paymentMethod: payload.paymentMethod,
    durationType,
    startAt,
    endAt,
    fulfillment: payload.fulfillment,
    address: payload.address ?? null,
    subtotal: totals.subtotal,
    depositAmount: totals.depositAmount,
    deliveryFee: totals.deliveryFee,
    pickupFee: totals.pickupFee,
    totalGst: totals.totalGst,
    total: totals.total,
    lateFees: 0,
    damageCharges: 0,
    refundAmount: 0,
    agreementAcceptedAt: now,
    termsAcceptedAt: now,
    trackingToken: generateRentalTrackingToken(),
    notes: payload.notes ?? null,
    createdAt: now,
    updatedAt: now,
    items: quotes.map((q) => ({
      productId: q.productId,
      productName: q.productName,
      productSlug: q.productSlug,
      unitId: null,
      quantity: q.quantity,
      durationType: q.durationType,
      durationUnits: q.durationUnits,
      unitRate: q.unitRate,
      lineSubtotal: q.lineSubtotal,
      depositAmount: q.depositAmount,
    })),
  });

  await createInventoryLocks(
    quotes.map((q) => ({
      unitId: null,
      productId: q.productId,
      bookingId,
      startAt: q.startAt,
      endAt: q.endAt,
      status: "held",
      expiresAt: lockExpires,
    }))
  );

  let razorpayOrderId: string | undefined;

  if (payload.paymentMethod === "razorpay") {
    if (canUseDemoPayments()) {
      await updateRentalBookingFields(bookingId, {
        paymentStatus: "paid",
        status: "confirmed",
      });
      await confirmInventoryLocksForBooking(bookingId);
      const confirmed = await getRentalBookingById(bookingId);
      if (confirmed) {
        await sendRentalBookingEmail(confirmed, "confirmed");
        await notifyRentalBookingUpdate(confirmed, "confirmed");
      }
      return { booking: confirmed, demoPaymentAllowed: true };
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: toPaise(totals.total),
      currency: "INR",
      receipt: bookingNumber,
      notes: { rentalBookingId: bookingId, type: "rental" },
    });
    razorpayOrderId = order.id;
    await updateRentalBookingFields(bookingId, { razorpayOrderId });
  } else {
    await confirmInventoryLocksForBooking(bookingId);
    const confirmed = await getRentalBookingById(bookingId);
    if (confirmed) {
      await sendRentalBookingEmail(confirmed, "confirmed");
      await notifyRentalBookingUpdate(confirmed, "confirmed");
    }
  }

  const saved = await getRentalBookingById(bookingId);
  return { booking: saved, razorpayOrderId };
}

export async function verifyRentalPayment(input: {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<Awaited<ReturnType<typeof getRentalBookingById>>> {
  const booking = await getRentalBookingById(input.bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.razorpayOrderId !== input.razorpayOrderId) {
    throw new Error("Payment order mismatch");
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("Missing RAZORPAY_KEY_SECRET");

  const valid = verifyRazorpayPaymentSignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.razorpaySignature,
    keySecret
  );
  if (!valid) throw new Error("Invalid payment signature");

  await updateRentalBookingFields(booking.id, {
    paymentStatus: "paid",
    status: "confirmed",
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
  });
  await confirmInventoryLocksForBooking(booking.id);
  await appendRentalStatusEvent({
    bookingId: booking.id,
    status: "confirmed",
    note: "Payment verified",
  });

  const updated = await getRentalBookingById(booking.id);
  if (updated) {
    await sendRentalBookingEmail(updated, "confirmed");
    await notifyRentalBookingUpdate(updated, "confirmed");
  }
  return updated;
}

export async function cancelRentalBooking(input: {
  bookingId: string;
  reason?: string;
  actorId?: string;
  actorEmail?: string;
  request?: Request;
}): Promise<Awaited<ReturnType<typeof getRentalBookingById>>> {
  const booking = await getRentalBookingById(input.bookingId);
  if (!booking) throw new Error("Booking not found");
  if (["completed", "cancelled", "returned"].includes(booking.status)) {
    throw new Error("Booking cannot be cancelled");
  }

  const now = new Date().toISOString();
  await updateRentalBookingFields(booking.id, {
    status: "cancelled",
    paymentStatus:
      booking.paymentStatus === "paid" ? "refunded" : booking.paymentStatus,
    cancelledAt: now,
    cancellationReason: input.reason ?? "Cancelled by customer",
    refundAmount:
      booking.paymentStatus === "paid" ? booking.total - booking.depositAmount : 0,
  });
  await releaseInventoryLocksForBooking(booking.id);
  await appendRentalStatusEvent({
    bookingId: booking.id,
    status: "cancelled",
    note: input.reason,
    createdBy: input.actorId,
  });

  await logAuditEvent({
    action: "rental.booking.cancelled",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    resourceType: "rental_booking",
    resourceId: booking.id,
    request: input.request,
    metadata: { bookingNumber: booking.bookingNumber, reason: input.reason },
  });

  const updated = await getRentalBookingById(booking.id);
  if (updated) {
    await sendRentalBookingEmail(updated, "cancelled");
    await notifyRentalBookingUpdate(updated, "cancelled");
  }
  return updated;
}

export async function markRentalReturned(input: {
  bookingId: string;
  returnedAt?: string;
  damageCharge?: number;
  actorId?: string;
  actorEmail?: string;
  request?: Request;
}): Promise<Awaited<ReturnType<typeof getRentalBookingById>>> {
  const booking = await getRentalBookingById(input.bookingId);
  if (!booking) throw new Error("Booking not found");

  const returnedAt = input.returnedAt ?? new Date().toISOString();
  const primaryItem = booking.items[0];
  const product = primaryItem
    ? await getRentalProductById(primaryItem.productId)
    : null;
  const lateFees = product
    ? calculateLateFee({
        lateFeePerDay: product.lateFeePerDay,
        dueAt: booking.endAt,
        returnedAt,
      })
    : 0;
  const damageCharges = Math.max(0, input.damageCharge ?? 0);

  if (lateFees > 0) {
    await addRentalCharge({
      bookingId: booking.id,
      type: "late_fee",
      amount: lateFees,
      description: "Late return fee",
      createdBy: input.actorId,
    });
  }
  if (damageCharges > 0) {
    await addRentalCharge({
      bookingId: booking.id,
      type: "damage",
      amount: damageCharges,
      description: "Damage charge",
      createdBy: input.actorId,
    });
  }

  await updateRentalBookingFields(booking.id, {
    status: "completed",
    returnedAt,
    lateFees,
    damageCharges,
  });
  await releaseInventoryLocksForBooking(booking.id);
  await appendRentalStatusEvent({
    bookingId: booking.id,
    status: "completed",
    note: "Rental returned",
    createdBy: input.actorId,
  });

  await logAuditEvent({
    action: "rental.booking.returned",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    resourceType: "rental_booking",
    resourceId: booking.id,
    request: input.request,
    metadata: { lateFees, damageCharges },
  });

  const updated = await getRentalBookingById(booking.id);
  if (updated) {
    await sendRentalBookingEmail(updated, "returned");
    await notifyRentalBookingUpdate(updated, "completed");
  }
  return updated;
}

export async function activateRentalBooking(
  bookingId: string,
  actorId?: string
): Promise<void> {
  const booking = await getRentalBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  await updateRentalBookingFields(bookingId, { status: "active" });
  await appendRentalStatusEvent({
    bookingId,
    status: "active",
    note: "Rental started",
    createdBy: actorId,
  });

  const updated = await getRentalBookingById(bookingId);
  if (updated) {
    await sendRentalBookingEmail(updated, "active");
    await notifyRentalBookingUpdate(updated, "active");
  }
}
