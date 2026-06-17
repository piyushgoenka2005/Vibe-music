"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AddressSuggestion {
  description: string;
  placeId: string;
}

interface UseAddressAutocompleteOptions {
  minLength?: number;
  debounceMs?: number;
}

export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {}
) {
  const minLength = options.minLength ?? 3;
  const debounceMs = options.debounceMs ?? 300;
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const search = useCallback(
    (input: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const trimmed = input.trim();
      if (trimmed.length < minLength) {
        setSuggestions([]);
        return;
      }

      timerRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({ input: trimmed });
          const res = await fetch(`/api/address/autocomplete?${params}`);
          if (!res.ok) {
            setSuggestions([]);
            return;
          }
          const data = (await res.json()) as {
            predictions?: AddressSuggestion[];
          };
          setSuggestions(data.predictions ?? []);
        } catch {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, minLength]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const resolvePlace = useCallback(async (placeId: string) => {
    const res = await fetch(
      `/api/address/place?placeId=${encodeURIComponent(placeId)}`
    );
    if (!res.ok) return null;
    return (await res.json()) as {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  }, []);

  return { suggestions, loading, search, clearSuggestions, resolvePlace };
}
