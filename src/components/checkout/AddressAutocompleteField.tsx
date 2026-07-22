"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ParsedPlaceAddress } from "@/lib/address/parseGoogleAddressComponents";

interface AddressPrediction {
  description: string;
  placeId: string;
}

interface AddressAutocompleteFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Fills city / state / PIN (and line2) when Place Details succeeds. */
  onResolvedAddress?: (address: ParsedPlaceAddress) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
  /** When false, skip Places calls and show a manual-entry hint. */
  autocompleteAvailable?: boolean;
}

export default function AddressAutocompleteField({
  value,
  onChange,
  onResolvedAddress,
  required,
  placeholder = "Street address",
  id,
  autocompleteAvailable = true,
}: AddressAutocompleteFieldProps) {
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [placesDisabledByApi, setPlacesDisabledByApi] = useState(false);
  const [resolving, setResolving] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autocompleteAvailable) {
      setPlacesDisabledByApi(false);
      return;
    }
    setPredictions([]);
    setOpen(false);
  }, [autocompleteAvailable]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  const placesOff = !autocompleteAvailable || placesDisabledByApi;

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!autocompleteAvailable || placesDisabledByApi) {
        setPredictions([]);
        return;
      }

      if (input.trim().length < 3) {
        setPredictions([]);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/address/autocomplete?input=${encodeURIComponent(input.trim())}`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setPredictions([]);
          return;
        }
        const data = (await response.json()) as {
          predictions?: AddressPrediction[];
          available?: boolean;
        };
        if (controller.signal.aborted) return;
        if (data.available === false) {
          setPlacesDisabledByApi(true);
          setPredictions([]);
          setOpen(false);
          return;
        }
        setPredictions(data.predictions ?? []);
        setOpen((data.predictions?.length ?? 0) > 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setPredictions([]);
      }
    },
    [autocompleteAvailable, placesDisabledByApi]
  );

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

  async function selectPrediction(prediction: AddressPrediction) {
    onChange(prediction.description);
    setPredictions([]);
    setOpen(false);

    if (!onResolvedAddress || placesOff) return;

    setResolving(true);
    try {
      const response = await fetch(
        `/api/address/details?placeId=${encodeURIComponent(prediction.placeId)}`
      );
      if (!response.ok) return;
      const data = (await response.json()) as {
        available?: boolean;
        address?: ParsedPlaceAddress | null;
      };
      if (data.available === false) {
        setPlacesDisabledByApi(true);
        return;
      }
      if (data.address) {
        if (data.address.line1) {
          onChange(data.address.line1);
        }
        onResolvedAddress(data.address);
      }
    } catch {
      /* Keep description in line1; user fills the rest. */
    } finally {
      setResolving(false);
    }
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
        aria-busy={resolving}
      />
      {placesOff ? (
        <span className="checkout-field-hint">
          Enter your full street address manually. Address suggestions are not
          available right now.
        </span>
      ) : resolving ? (
        <span className="checkout-field-hint">Filling city, state &amp; PIN…</span>
      ) : (
        <span className="checkout-field-hint">
          Pick a suggestion to auto-fill city, state, and PIN when available.
        </span>
      )}
      {open && predictions.length > 0 ? (
        <ul role="listbox" className="checkout-address-suggest">
          {predictions.map((prediction) => (
            <li key={prediction.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="checkout-address-suggest__option"
                onClick={() => void selectPrediction(prediction)}
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
