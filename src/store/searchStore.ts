"use client";

import { useSyncExternalStore } from "react";
import type { SearchAnalyticsEvent, SearchFiltersState } from "@/types/search";

const RECENT_KEY = "vibe-recent-searches";
const ANALYTICS_KEY = "vibe-search-analytics";
const MAX_RECENT = 8;
const MAX_ANALYTICS = 50;

export interface AnchorRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

export interface SearchStoreState {
  query: string;
  isOverlayOpen: boolean;
  isMobile: boolean;
  anchorRect: AnchorRect | null;
  activeInputId: string | null;
  recentSearches: string[];
  analytics: SearchAnalyticsEvent[];
  filters: SearchFiltersState;
}

type Listener = () => void;

const defaultFilters: SearchFiltersState = {
  category: "",
  brand: "",
  minPrice: "",
  maxPrice: "",
  sort: "relevance",
};

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function readAnalytics(): SearchAnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY);
    return raw ? (JSON.parse(raw) as SearchAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

const EMPTY_RECENT: string[] = [];
const EMPTY_ANALYTICS: SearchAnalyticsEvent[] = [];

let state: SearchStoreState = {
  query: "",
  isOverlayOpen: false,
  isMobile: false,
  anchorRect: null,
  activeInputId: null,
  recentSearches: EMPTY_RECENT,
  analytics: EMPTY_ANALYTICS,
  filters: defaultFilters,
};

const SERVER_SNAPSHOT: SearchStoreState = {
  query: "",
  isOverlayOpen: false,
  isMobile: false,
  anchorRect: null,
  activeInputId: null,
  recentSearches: EMPTY_RECENT,
  analytics: EMPTY_ANALYTICS,
  filters: defaultFilters,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persistRecent(recent: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

function persistAnalytics(events: SearchAnalyticsEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
}

export const searchStore = {
  getState: () => state,

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  hydrate() {
    state = {
      ...state,
      recentSearches: readRecent(),
      analytics: readAnalytics(),
    };
    emit();
  },

  setQuery(query: string) {
    state = { ...state, query };
    emit();
  },

  openOverlay(anchorRect: DOMRect | null, inputId: string, isMobile: boolean) {
    const rect = anchorRect
      ? {
          top: anchorRect.top,
          left: anchorRect.left,
          bottom: anchorRect.bottom,
          right: anchorRect.right,
          width: anchorRect.width,
          height: anchorRect.height,
        }
      : null;
    state = {
      ...state,
      isOverlayOpen: true,
      anchorRect: rect,
      activeInputId: inputId,
      isMobile,
    };
    emit();
  },

  closeOverlay() {
    state = {
      ...state,
      isOverlayOpen: false,
      anchorRect: null,
      activeInputId: null,
    };
    emit();
  },

  addRecentSearch(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const next = [
      trimmed,
      ...state.recentSearches.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      ),
    ].slice(0, MAX_RECENT);
    state = { ...state, recentSearches: next };
    persistRecent(next);
    emit();
  },

  clearRecentSearches() {
    state = { ...state, recentSearches: [] };
    persistRecent([]);
    emit();
  },

  trackSearch(event: Omit<SearchAnalyticsEvent, "timestamp">) {
    const entry: SearchAnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
    };
    const next = [entry, ...state.analytics].slice(0, MAX_ANALYTICS);
    state = { ...state, analytics: next };
    persistAnalytics(next);
    emit();
  },

  setFilters(filters: Partial<SearchFiltersState>) {
    const next = { ...state.filters, ...filters };
    if (
      next.category === state.filters.category &&
      next.brand === state.filters.brand &&
      next.minPrice === state.filters.minPrice &&
      next.maxPrice === state.filters.maxPrice &&
      next.sort === state.filters.sort
    ) {
      return;
    }
    state = { ...state, filters: next };
    emit();
  },

  resetFilters() {
    state = { ...state, filters: defaultFilters };
    emit();
  },
};

export function useSearchStore<T>(selector: (s: SearchStoreState) => T): T {
  return useSyncExternalStore(
    searchStore.subscribe,
    () => selector(searchStore.getState()),
    () => selector(SERVER_SNAPSHOT)
  );
}
