"use client";

import {
  SHIPPING_METHOD_IDS,
  SHIPPING_METHODS,
  type ShippingMethod,
} from "@/lib/shipping/shippingMethods";
import { formatCurrencyPrecise } from "@/utils/currency";

interface ShippingMethodPickerProps {
  value: ShippingMethod;
  onChange: (method: ShippingMethod) => void;
  charges: Partial<Record<ShippingMethod, number>>;
  disabled?: boolean;
}

export default function ShippingMethodPicker({
  value,
  onChange,
  charges,
  disabled,
}: ShippingMethodPickerProps) {
  return (
    <fieldset className="checkout-shipping-methods" disabled={disabled}>
      <legend className="checkout-shipping-methods__legend">Delivery speed</legend>
      <div className="checkout-shipping-methods__list">
        {SHIPPING_METHOD_IDS.map((id) => {
          const config = SHIPPING_METHODS[id];
          const charge = charges[id] ?? config.charge;
          return (
            <label key={id} className="checkout-shipping-methods__option">
              <input
                type="radio"
                name="shippingMethod"
                value={id}
                checked={value === id}
                onChange={() => onChange(id)}
              />
              <span className="checkout-shipping-methods__body">
                <span className="checkout-shipping-methods__label">{config.label}</span>
                <span className="checkout-shipping-methods__desc">{config.description}</span>
              </span>
              <span className="checkout-shipping-methods__price">
                {charge === 0 ? "Free" : formatCurrencyPrecise(charge)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
