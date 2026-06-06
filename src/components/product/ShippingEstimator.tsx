"use client";

import { useState } from "react";

export default function ShippingEstimator() {
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function estimate() {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setResult("Please enter a valid 5-digit ZIP code.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      const zone = Number(trimmed[0]);
      const days = zone <= 3 ? "1–2" : zone <= 6 ? "2–3" : "3–5";
      setResult(`Estimated delivery: ${days} business days to ${trimmed}. Free shipping on orders over $99.`);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="pdp-shipping" aria-label="Shipping estimator">
      <h3 className="pdp-shipping__title">Estimate Shipping</h3>
      <div className="pdp-shipping__row">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          maxLength={5}
          aria-label="ZIP code"
        />
        <button type="button" onClick={estimate} disabled={loading}>
          {loading ? "..." : "Get Estimate"}
        </button>
      </div>
      {result ? <p className="pdp-shipping__result">{result}</p> : null}
    </div>
  );
}
