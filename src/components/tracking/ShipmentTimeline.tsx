"use client";

import type { PublicShipmentTracking } from "@/types/shipment";
import { shipmentStatusLabel } from "@/types/shipment";

function formatTrackingDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ShipmentTimelineProps {
  shipment: PublicShipmentTracking;
}

export default function ShipmentTimeline({ shipment }: ShipmentTimelineProps) {
  const events = shipment.events.length
    ? shipment.events
    : [
        {
          id: "status",
          status: shipment.status,
          title: shipment.statusLabel,
          occurredAt: shipment.shippedAt ?? new Date().toISOString(),
        },
      ];

  return (
    <div className="track-shipment">
      <div className="track-shipment__summary">
        <div>
          <p className="track-shipment__label">Shipment status</p>
          <p className="track-shipment__status">{shipment.statusLabel}</p>
        </div>
        <div>
          <p className="track-shipment__label">Carrier</p>
          <p className="track-shipment__value">{shipment.carrier}</p>
        </div>
        <div>
          <p className="track-shipment__label">Tracking number</p>
          <p className="track-shipment__value track-shipment__tracking">
            {shipment.trackingNumber}
          </p>
        </div>
        {shipment.estimatedDelivery ? (
          <div>
            <p className="track-shipment__label">Estimated delivery</p>
            <p className="track-shipment__value">
              {formatTrackingDate(shipment.estimatedDelivery)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="track-timeline" aria-label="Shipment timeline">
        <h3 className="track-timeline__title">Delivery updates</h3>
        <ol className="track-timeline__list">
          {events.map((event, index) => (
            <li
              key={event.id}
              className={`track-timeline__item${index === 0 ? " track-timeline__item--current" : ""}`}
            >
              <div className="track-timeline__marker" aria-hidden />
              <div className="track-timeline__content">
                <p className="track-timeline__event-title">{event.title}</p>
                <p className="track-timeline__meta">
                  {shipmentStatusLabel(event.status)} ·{" "}
                  {formatTrackingDate(event.occurredAt)}
                </p>
                {event.location ? (
                  <p className="track-timeline__location">{event.location}</p>
                ) : null}
                {event.description ? (
                  <p className="track-timeline__description">{event.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
