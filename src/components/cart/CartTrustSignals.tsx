"use client";

const TRUST_ITEMS = [
  "Secure checkout",
  "Genuine products",
  "Authorized dealer",
  "Manufacturer warranty",
  "Easy returns",
  "Safe payments",
  "GST invoice",
  "Expert support",
] as const;

export default function CartTrustSignals() {
  return (
    <ul className="cart-trust" aria-label="Why shop with Vibe Music">
      {TRUST_ITEMS.map((item) => (
        <li key={item} className="cart-trust__item">
          <span className="cart-trust__mark" aria-hidden="true">
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
