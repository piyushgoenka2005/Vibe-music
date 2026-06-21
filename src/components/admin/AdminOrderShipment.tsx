"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Shipment, ShipmentCarrier, ShipmentStatus, TrackingEvent } from "@/types/shipment";
import {
  SHIPMENT_CARRIER_LABELS,
  SHIPMENT_STATUS_LABELS,
} from "@/types/shipment";
import { formatDate } from "@/components/admin/AdminUi";

interface AdminOrderShipmentProps {
  orderId: string;
}

async function fetchShipment(orderId: string): Promise<{
  shipment: Shipment | null;
  events: TrackingEvent[];
}> {
  const res = await fetch(`/api/admin/orders/${orderId}/shipment`);
  if (!res.ok) throw new Error("Failed to load shipment");
  return res.json();
}

const CARRIERS = Object.entries(SHIPMENT_CARRIER_LABELS) as Array<
  [ShipmentCarrier, string]
>;
const STATUSES = Object.entries(SHIPMENT_STATUS_LABELS) as Array<
  [ShipmentStatus, string]
>;

interface ShipmentFormProps {
  orderId: string;
  shipment: Shipment | null;
  events: TrackingEvent[];
}

function ShipmentForm({ orderId, shipment, events }: ShipmentFormProps) {
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState(shipment?.trackingNumber ?? "");
  const [carrier, setCarrier] = useState<ShipmentCarrier>(shipment?.carrier ?? "delhivery");
  const [status, setStatus] = useState<ShipmentStatus>(shipment?.status ?? "label_created");
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    shipment?.estimatedDelivery ? shipment.estimatedDelivery.slice(0, 10) : ""
  );
  const [eventStatus, setEventStatus] = useState<ShipmentStatus>("in_transit");
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber,
          carrier,
          status,
          estimatedDelivery: estimatedDelivery
            ? new Date(`${estimatedDelivery}T12:00:00`).toISOString()
            : null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to save shipment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-shipment", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const eventMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: eventStatus,
          title: eventTitle || undefined,
          location: eventLocation || undefined,
          description: eventDescription || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to add tracking event");
      }
      return res.json();
    },
    onSuccess: () => {
      setEventTitle("");
      setEventLocation("");
      setEventDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin-order-shipment", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  return (
    <>
      <div className="admin-form-group">
        <label>Tracking number</label>
        <input
          className="admin-input"
          style={{ width: "100%" }}
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="e.g. BD123456789IN"
        />
      </div>

      <div className="admin-form-group">
        <label>Carrier</label>
        <select
          className="admin-select"
          style={{ width: "100%" }}
          value={carrier}
          onChange={(e) => setCarrier(e.target.value as ShipmentCarrier)}
        >
          {CARRIERS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-form-group">
        <label>Shipment status</label>
        <select
          className="admin-select"
          style={{ width: "100%" }}
          value={status}
          onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
        >
          {STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-form-group">
        <label>Estimated delivery</label>
        <input
          className="admin-input"
          style={{ width: "100%" }}
          type="date"
          value={estimatedDelivery}
          onChange={(e) => setEstimatedDelivery(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="admin-btn admin-btn--secondary"
        disabled={saveMutation.isPending || !trackingNumber.trim()}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? "Saving…" : shipment ? "Update shipment" : "Create shipment"}
      </button>
      {saveMutation.isError ? (
        <p role="alert" style={{ color: "#c5221f", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      ) : null}

      {shipment ? (
        <>
          <h4 style={{ margin: "1.25rem 0 0.75rem", fontSize: "0.9375rem" }}>Add delivery update</h4>
          <div className="admin-form-group">
            <label>Event status</label>
            <select
              className="admin-select"
              style={{ width: "100%" }}
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value as ShipmentStatus)}
            >
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label>Title (optional)</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Defaults to status label"
            />
          </div>
          <div className="admin-form-group">
            <label>Location</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="City or hub name"
            />
          </div>
          <div className="admin-form-group">
            <label>Description</label>
            <textarea
              className="admin-input"
              style={{ width: "100%", minHeight: "4rem" }}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={eventMutation.isPending}
            onClick={() => eventMutation.mutate()}
          >
            {eventMutation.isPending ? "Adding…" : "Add tracking event"}
          </button>
          {eventMutation.isError ? (
            <p role="alert" style={{ color: "#c5221f", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              {eventMutation.error instanceof Error ? eventMutation.error.message : "Add event failed"}
            </p>
          ) : null}

          <h4 style={{ margin: "1.25rem 0 0.75rem", fontSize: "0.9375rem" }}>Timeline</h4>
          {events.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>No delivery updates yet.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {events.map((event) => (
                <li
                  key={event.id}
                  style={{
                    padding: "0.65rem 0",
                    borderBottom: "1px solid var(--admin-border)",
                    fontSize: "0.875rem",
                  }}
                >
                  <strong>{event.title}</strong>
                  <p style={{ margin: "0.2rem 0", color: "var(--admin-muted)" }}>
                    {SHIPMENT_STATUS_LABELS[event.status]} · {formatDate(event.occurredAt)}
                  </p>
                  {event.location ? <p style={{ margin: 0 }}>{event.location}</p> : null}
                  {event.description ? (
                    <p style={{ margin: "0.2rem 0 0", color: "var(--admin-muted)" }}>
                      {event.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </>
  );
}

export default function AdminOrderShipment({ orderId }: AdminOrderShipmentProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-order-shipment", orderId],
    queryFn: () => fetchShipment(orderId),
  });

  if (isLoading) {
    return <p style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>Loading shipment…</p>;
  }

  const formKey = `${orderId}:${data?.shipment?.updatedAt ?? "new"}:${data?.events.length ?? 0}`;

  return (
    <div className="admin-shipment" style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--admin-border)" }}>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Shipment</h3>
      <ShipmentForm
        key={formKey}
        orderId={orderId}
        shipment={data?.shipment ?? null}
        events={data?.events ?? []}
      />
    </div>
  );
}
