import type { Order, OrderStatus } from "@/types/order";
import type { PublicShipmentTracking, ShipmentStatus } from "@/types/shipment";

export type OrderTimelineStepId =
  | "placed"
  | "payment_confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderTimelineStepState =
  | "complete"
  | "current"
  | "upcoming"
  | "skipped";

export interface OrderTimelineStep {
  id: OrderTimelineStepId;
  label: string;
  state: OrderTimelineStepState;
  occurredAt?: string;
  description?: string;
}

const STANDARD_STEPS: Array<{ id: OrderTimelineStepId; label: string }> = [
  { id: "placed", label: "Order Placed" },
  { id: "payment_confirmed", label: "Payment Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out For Delivery" },
  { id: "delivered", label: "Delivered" },
];

function isPaymentConfirmed(order: Order): boolean {
  return (
    order.paymentStatus === "paid" ||
    order.paymentStatus === "cod_pending" ||
    order.paymentStatus === "refunded"
  );
}

function shipmentReached(status: ShipmentStatus, target: ShipmentStatus): boolean {
  const order: ShipmentStatus[] = [
    "pending",
    "label_created",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "exception",
    "returned",
  ];
  return order.indexOf(status) >= order.indexOf(target);
}

function findShipmentEventAt(
  shipment: PublicShipmentTracking | null,
  status: ShipmentStatus
): string | undefined {
  return shipment?.events.find((event) => event.status === status)?.occurredAt;
}

function stepCompleted(
  stepId: OrderTimelineStepId,
  order: Order,
  shipment: PublicShipmentTracking | null
): boolean {
  switch (stepId) {
    case "placed":
      return true;
    case "payment_confirmed":
      return isPaymentConfirmed(order);
    case "packed":
      return (
        isPaymentConfirmed(order) &&
        (["processing", "confirmed", "shipped", "delivered"].includes(
          order.status
        ) ||
          Boolean(shipment))
      );
    case "shipped":
      return (
        order.status === "shipped" ||
        order.status === "delivered" ||
        Boolean(
          shipment &&
            (shipment.shippedAt ||
              shipmentReached(shipment.status, "picked_up"))
        )
      );
    case "out_for_delivery":
      return (
        order.status === "delivered" ||
        Boolean(
          shipment &&
            (shipmentReached(shipment.status, "out_for_delivery") ||
              findShipmentEventAt(shipment, "out_for_delivery"))
        )
      );
    case "delivered":
      return (
        order.status === "delivered" ||
        Boolean(shipment?.deliveredAt || shipment?.status === "delivered")
      );
    default:
      return false;
  }
}

function stepTimestamp(
  stepId: OrderTimelineStepId,
  order: Order,
  shipment: PublicShipmentTracking | null
): string | undefined {
  switch (stepId) {
    case "placed":
      return order.createdAt;
    case "payment_confirmed":
      return (
        order.paymentCompletedAt ??
        (isPaymentConfirmed(order) ? order.createdAt : undefined)
      );
    case "packed":
      return stepCompleted("packed", order, shipment)
        ? order.updatedAt ?? order.createdAt
        : undefined;
    case "shipped":
      return (
        shipment?.shippedAt ??
        findShipmentEventAt(shipment, "picked_up") ??
        findShipmentEventAt(shipment, "in_transit") ??
        (order.status === "shipped" || order.status === "delivered"
          ? order.updatedAt
          : undefined)
      );
    case "out_for_delivery":
      return findShipmentEventAt(shipment, "out_for_delivery");
    case "delivered":
      return (
        shipment?.deliveredAt ??
        findShipmentEventAt(shipment, "delivered") ??
        (order.status === "delivered" ? order.updatedAt : undefined)
      );
    default:
      return undefined;
  }
}

function cancelledDescription(status: OrderStatus): string {
  if (status === "refunded") {
    return "This order was refunded.";
  }
  return "This order was cancelled.";
}

export function buildOrderTimeline(
  order: Order,
  shipment: PublicShipmentTracking | null
): OrderTimelineStep[] {
  if (order.status === "cancelled" || order.status === "refunded") {
    const steps: OrderTimelineStep[] = [
      {
        id: "placed",
        label: "Order Placed",
        state: "complete",
        occurredAt: order.createdAt,
      },
    ];

    if (isPaymentConfirmed(order)) {
      steps.push({
        id: "payment_confirmed",
        label: "Payment Confirmed",
        state: "complete",
        occurredAt: stepTimestamp("payment_confirmed", order, shipment),
      });
    }

    steps.push({
      id: "cancelled",
      label: order.status === "refunded" ? "Refunded" : "Cancelled",
      state: "current",
      occurredAt: order.refundedAt ?? order.updatedAt ?? order.createdAt,
      description: cancelledDescription(order.status),
    });

    return steps;
  }

  const completed = STANDARD_STEPS.map((step) =>
    stepCompleted(step.id, order, shipment)
  );
  const firstIncompleteIndex = completed.findIndex((value) => !value);

  return STANDARD_STEPS.map((step, index) => {
    const isComplete = completed[index];
    let state: OrderTimelineStepState = "upcoming";

    if (isComplete) {
      state = "complete";
    } else if (
      firstIncompleteIndex === index ||
      (firstIncompleteIndex === -1 && index === STANDARD_STEPS.length - 1)
    ) {
      state = firstIncompleteIndex === -1 ? "complete" : "current";
    }

    return {
      id: step.id,
      label: step.label,
      state,
      occurredAt: isComplete
        ? stepTimestamp(step.id, order, shipment)
        : undefined,
    };
  });
}
