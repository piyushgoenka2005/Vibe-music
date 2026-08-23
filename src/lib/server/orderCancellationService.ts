import "server-only";

import { logAuditEvent } from "@/lib/server/auditLog";
import { dispatchLifecycleNotification } from "@/lib/server/notifications";
import {
  initiateOrderRefund,
} from "@/lib/server/razorpayRefundService";
import { patchOrderFields } from "@/lib/server/prisma/orderRepository";
import { releaseOrderInventory } from "@/lib/server/inventoryService";
import { canAccessOrder } from "@/lib/server/orderAccess";
import type { Order, OrderStatus } from "@/types/order";

/**
 * Statuses a customer may still cancel themselves. Once we start packing
 * (processing) or ship, only support/admin can cancel or refund.
 */
const CUSTOMER_CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
];

export function isCustomerCancellable(order: Order): boolean {
  return CUSTOMER_CANCELLABLE_STATUSES.includes(order.status);
}

export class OrderCancellationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderCancellationError";
    this.status = status;
  }
}

async function sendCancellationComms(
  order: Order,
  refunded: boolean
): Promise<void> {
  try {
    await dispatchLifecycleNotification({
      event: "order_cancelled",
      recipient: {
        email: order.email,
        phone: order.shippingAddress?.phone ?? null,
        userId: order.userId ?? null,
        customerName: order.customerName ?? null,
      },
      context: {
        orderId: order.id,
        total: order.total,
      },
    });
    if (refunded) {
      await dispatchLifecycleNotification({
        event: "refund_initiated",
        recipient: {
          email: order.email,
          phone: order.shippingAddress?.phone ?? null,
          userId: order.userId ?? null,
          customerName: order.customerName ?? null,
        },
        context: { orderId: order.id, total: order.total },
      });
    }
  } catch {
    // Comms are best-effort; cancellation itself must not fail on SMTP hiccups.
  }
}

export interface CancelOrderInput {
  orderId: string;
  /** Session user id (logged-in owner) — optional when guest access is used. */
  sessionUid?: string | null;
  sessionIsAdmin?: boolean;
  /** Guest access via email/tracking-token match, same as order detail GET. */
  guestEmail?: string | null;
  trackingToken?: string | null;
  reason?: string;
  request?: Request;
}

export async function cancelOrderAsCustomer(
  input: CancelOrderInput
): Promise<{ order: Order; refundInitiated: boolean }> {
  // Authorization mirrors GET /api/orders/[orderId]: session-owner, admin,
  // or guest email / tracking-token match.
  const order = await (async () => {
    const { getOrderById } = await import("@/lib/server/orderService");
    return getOrderById(input.orderId);
  })();

  if (!order) throw new OrderCancellationError("Order not found", 404);

  if (input.sessionIsAdmin !== true) {
    const allowed =
      (input.sessionUid && order.userId === input.sessionUid) ||
      canAccessOrder(order, {
        email: input.guestEmail ?? undefined,
        trackingToken: input.trackingToken ?? undefined,
      });
    if (!allowed) {
      throw new OrderCancellationError("Not authorized to cancel this order", 403);
    }
  }

  if (!isCustomerCancellable(order)) {
    throw new OrderCancellationError(
      "This order can no longer be cancelled online. Contact support and we'll take care of it.",
      409
    );
  }

  // Idempotency guard against double-clicks / racing requests.
  if (order.status === "cancelled") {
    return { order, refundInitiated: false };
  }

  const cancelledAt = new Date().toISOString();
  let updated = await patchOrderFields(order.id, {
    status: "cancelled",
    updatedAt: cancelledAt,
  });

  // Return reserved stock immediately so the catalog stays accurate.
  try {
    await releaseOrderInventory(updated);
  } catch {
    // Non-fatal: admin inventory view surfaces mismatches; never block cancel.
  }

  // Paid online orders are auto-refunded through Razorpay. COD orders simply
  // cancel (nothing was captured).
  let refundInitiated = false;
  if (updated.paymentStatus === "paid" && updated.razorpayPaymentId) {
    try {
      await initiateOrderRefund({
        orderId: updated.id,
        actorEmail: updated.email,
        note: "Customer self-cancellation",
        request: input.request,
      });
      refundInitiated = true;
      updated = await patchOrderFields(updated.id, {
        paymentStatus: "refunded",
        refundedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      // Refund failures keep the cancellation but leave a loud audit trail.
      await logAuditEvent({
        action: "order.cancel_refund_failed",
        actorEmail: updated.email,
        resourceType: "order",
        resourceId: updated.id,
        request: input.request,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => undefined);
    }
  }

  await logAuditEvent({
    action: "order.customer_cancelled",
    actorEmail: updated.email,
    resourceType: "order",
    resourceId: updated.id,
    request: input.request,
    metadata: {
      reason: input.reason?.slice(0, 300),
      refundInitiated,
      via: input.sessionIsAdmin ? "admin" : input.sessionUid ? "account" : "guest",
    },
  }).catch(() => undefined);

  void sendCancellationComms(updated, refundInitiated);

  return { order: updated, refundInitiated };
}
