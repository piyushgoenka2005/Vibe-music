"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export const ADMIN_SEARCH_DEBOUNCE_MS = 300;

/**
 * Admin list search: the input updates on every keystroke, while `query`
 * (the value to put in a query key) only changes once typing pauses.
 */
export function useAdminSearchTerm(initial = "", delayMs = ADMIN_SEARCH_DEBOUNCE_MS) {
  const [input, setInput] = useState(initial);
  const trimmed = input.trim();
  const query = useDebounce(trimmed, delayMs);
  return { input, setInput, query, isDebouncing: trimmed !== query };
}
