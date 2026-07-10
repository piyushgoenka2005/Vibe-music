"use client";

import { useState } from "react";
import { formatCurrencyPrecise } from "@/utils/currency";

interface ShippingQuoteMethod {
  id: string;
  label: string;
  description: string;
  charge: number;
  etaDays?: string;
}

interface ShippingEstimatorProps {
  subtotal?: number;
}

export default function ShippingEstimator({ subtotal = 0 }: ShippingEstimatorProps) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function estimate() {
    const trimmed = pincode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setResult("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal,
          discount: 0,
          postalCode: trimmed,
        }),
      });

      if (!response.ok) {
        setResult("Unable to fetch shipping options. Please try again.");
        return;
      }

      const data = (await response.json()) as {
        methods?: ShippingQuoteMethod[];
        zone?: { name: string } | null;
      };
      const methods = data.methods ?? [];
      const standard = methods.find((m) => m.id === "standard");
      const express = methods.find((m) => m.id === "express");

      const standardCharge =
        standard?.charge === 0
          ? "free"
          : formatCurrencyPrecise(standard?.charge ?? 100);
      const expressNote = express
        ? ` Express from ${formatCurrencyPrecise(express.charge)} (${express.description.toLowerCase()}).`
        : "";

      const zoneNote = data.zone?.name ? ` Zone: ${data.zone.name}.` : "";

      setResult(
        `Delivering to PIN ${trimmed}: Standard ${standardCharge} — ${standard?.description ?? "5–7 business days"}.${expressNote}${zoneNote}`
      );
    } catch {
      setResult("Unable to fetch shipping options. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pdp-shipping" aria-label="Shipping estimator">
      <h3 className="pdp-shipping__title">Estimate Shipping</h3>
      <div className="pdp-shipping__row">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter PIN code"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          aria-label="PIN code"
        />
        <button type="button" onClick={() => void estimate()} disabled={loading}>
          {loading ? "..." : "Get Estimate"}
        </button>
      </div>
      {result ? <p className="pdp-shipping__result">{result}</p> : null}
    </div>
  );
}
