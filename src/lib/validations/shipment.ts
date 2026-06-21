import { z } from "zod";

const shipmentStatusSchema = z.enum([
  "pending",
  "label_created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "returned",
]);

const carrierSchema = z.enum([
  "bluedart",
  "delhivery",
  "dtdc",
  "fedex",
  "ups",
  "india_post",
  "amazon_logistics",
  "other",
]);

export const upsertShipmentSchema = z.object({
  trackingNumber: z.string().trim().min(4).max(64),
  carrier: carrierSchema,
  carrierName: z.string().trim().max(80).optional(),
  status: shipmentStatusSchema.optional(),
  estimatedDelivery: z.string().trim().max(40).nullable().optional(),
});

export const addTrackingEventSchema = z.object({
  status: shipmentStatusSchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  occurredAt: z.string().trim().max(40).optional(),
});
