"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AddressPrediction {
  description: string;
  placeId: string;
}

interface AddressAutocompleteFieldProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
  /** When false, skip Places calls and show a manual-entry hint. */
  autocompleteAvailable?: boolean;
}

export default function AddressAutocompleteField({
  value,
  onChange,
  required,
  placeholder = "Street address",
  id,
  autocompleteAvailable = true,
}: AddressAutocompleteFieldProps) {
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [placesOff, setPlacesOff] = useState(!autocompleteAvailable);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlacesOff(!autocompleteAvailable);
  }, [autocompleteAvailable]);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!autocompleteAvailable || placesOff) {
      setPredictions([]);
      return;
    }

    if (input.trim().length < 3) {
      setPredictions([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/address/autocomplete?input=${encodeURIComponent(input.trim())}`
      );
      if (!response.ok) {
        setPredictions([]);
        return;
      }
      const data = (await response.json()) as {
        predictions?: AddressPrediction[];
        available?: boolean;
      };
      if (data.available === false) {
        setPlacesOff(true);
        setPredictions([]);
        setOpen(false);
        return;
      }
      setPredictions(data.predictions ?? []);
      setOpen((data.predictions?.length ?? 0) > 0);
    } catch {
      setPredictions([]);
    }
  }, [autocompleteAvailable, placesOff]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(next: string) {
    onChange(next);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      void fetchPredictions(next);
    }, 300);
  }

  function selectPrediction(prediction: AddressPrediction) {
    onChange(prediction.description);
    setPredictions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        id={id}
        required={required}
        value={value}
        autoComplete="street-address"
        placeholder={placeholder}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => {
          if (predictions.length > 0) setOpen(true);
        }}
      />
      {placesOff ? (
        <span className="checkout-field-hint">
          Enter your full street address manually. Address suggestions are not
          available right now.
        </span>
      ) : null}
      {open && predictions.length > 0 ? (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 20,
            top: "100%",
            left: 0,
            right: 0,
            margin: "0.25rem 0 0",
            padding: 0,
            listStyle: "none",
            background: "var(--color-surface, #fff)",
            border: "1px solid #ddd",
            borderRadius: "4px",
            maxHeight: "12rem",
            overflowY: "auto",
          }}
        >
          {predictions.map((prediction) => (
            <li key={prediction.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => selectPrediction(prediction)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem 0.75rem",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {prediction.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
