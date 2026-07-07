"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import {
  fetchSearchResults,
  fetchSearchSuggestions,
  MIN_QUERY_LENGTH,
} from "@/services/search.service";
import { searchStore, useSearchStore } from "@/store/searchStore";
import type {
  SearchResultsData,
  SearchStatus,
  SearchSuggestion,
  SearchSuggestionGroups,
} from "@/types/search";

function flattenSuggestions(groups: SearchSuggestionGroups): SearchSuggestion[] {
  return [
    ...groups.recent,
    ...groups.products,
    ...groups.categories,
    ...groups.brands,
  ];
}

interface UseSearchOptions {
  /** Fetch suggestions without opening the header overlay (e.g. search landing page). */
  inlineSuggestions?: boolean;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { inlineSuggestions = false } = options;
  const router = useRouter();
  const query = useSearchStore((s) => s.query);
  const recentSearches = useSearchStore((s) => s.recentSearches);
  const isOverlayOpen = useSearchStore((s) => s.isOverlayOpen);
  const suggestionsActive = isOverlayOpen || inlineSuggestions;

  const debouncedQuery = useDebounce(query, 300);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SearchSuggestionGroups>({
    products: [],
    categories: [],
    brands: [],
    recent: [],
  });
  const [activeIndex, setActiveIndex] = useState(-1);

  const flatSuggestions = useMemo(() => flattenSuggestions(groups), [groups]);

  useEffect(() => {
    if (!suggestionsActive) return;

    let cancelled = false;

    async function run() {
      if (debouncedQuery.length > 0 && debouncedQuery.length < MIN_QUERY_LENGTH) {
        setStatus("idle");
        setError(null);
        setGroups({
          products: [],
          categories: [],
          brands: [],
          recent: recentSearches.slice(0, 5).map((item, index) => ({
            id: `recent-${index}`,
            type: "recent" as const,
            label: item,
            href: `/search/results?q=${encodeURIComponent(item)}`,
          })),
        });
        setActiveIndex(-1);
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const next = await fetchSearchSuggestions(debouncedQuery, recentSearches);
        if (cancelled) return;
        setGroups(next);
        setStatus("success");
        setActiveIndex(-1);
      } catch {
        if (cancelled) return;
        setStatus("error");
        setError("Search is temporarily unavailable. Please try again.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, recentSearches, suggestionsActive]);

  const setQuery = useCallback((value: string) => {
    searchStore.setQuery(value);
  }, []);

  const openOverlay = useCallback(
    (anchorRect: DOMRect | null, inputId: string, isMobile: boolean) => {
      searchStore.openOverlay(anchorRect, inputId, isMobile);
    },
    []
  );

  const closeOverlay = useCallback(() => {
    searchStore.closeOverlay();
    setActiveIndex(-1);
  }, []);

  const submitSearch = useCallback(
    (value?: string) => {
      const next = (value ?? query).trim();
      if (next.length < MIN_QUERY_LENGTH) return;
      searchStore.addRecentSearch(next);
      closeOverlay();
      router.push(`/search/results?q=${encodeURIComponent(next)}`);
    },
    [closeOverlay, query, router]
  );

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      searchStore.addRecentSearch(suggestion.label);
      if (suggestion.type === "product" && suggestion.productSlug) {
        searchStore.trackSearchClick({
          query: query.trim() || suggestion.label,
          productId: suggestion.id,
          productSlug: suggestion.productSlug,
          productName: suggestion.label,
          source: "autocomplete",
        });
      }
      closeOverlay();
      router.push(suggestion.href);
    },
    [closeOverlay, query, router]
  );

  const moveActiveIndex = useCallback(
    (direction: 1 | -1) => {
      if (flatSuggestions.length === 0) {
        setActiveIndex(-1);
        return;
      }
      setActiveIndex((current) => {
        if (current < 0) return direction === 1 ? 0 : flatSuggestions.length - 1;
        const next = current + direction;
        if (next < 0) return flatSuggestions.length - 1;
        if (next >= flatSuggestions.length) return 0;
        return next;
      });
    },
    [flatSuggestions.length]
  );

  const handleEnter = useCallback(() => {
    if (activeIndex >= 0 && flatSuggestions[activeIndex]) {
      selectSuggestion(flatSuggestions[activeIndex]);
      return;
    }
    submitSearch();
  }, [activeIndex, flatSuggestions, selectSuggestion, submitSearch]);

  return {
    query,
    debouncedQuery,
    status,
    error,
    groups,
    flatSuggestions,
    activeIndex,
    setActiveIndex,
    setQuery,
    openOverlay,
    closeOverlay,
    submitSearch,
    selectSuggestion,
    moveActiveIndex,
    handleEnter,
    isOverlayOpen,
    recentSearches,
  };
}

export function useSearchResults(
  query: string,
  filters?: {
    category?: string;
    brand?: string;
    sort?: string;
  },
  options?: {
    /** Server-rendered results matching the initial query/filters. */
    initialResults?: SearchResultsData | null;
    initialFilters?: { category?: string; brand?: string };
  }
) {
  const initialResults = options?.initialResults ?? null;
  const [status, setStatus] = useState<SearchStatus>(
    initialResults ? "success" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultsData | null>(
    initialResults
  );
  const category = filters?.category;
  const brand = filters?.brand;
  const sort = filters?.sort;
  const initialKeyRef = useRef<string | null>(
    initialResults
      ? [
          query.trim(),
          options?.initialFilters?.category ?? "",
          options?.initialFilters?.brand ?? "",
          "",
        ].join("|")
      : null
  );

  useEffect(() => {
    let cancelled = false;

    // Server already rendered these exact results — skip the duplicate fetch.
    const requestKey = [
      query.trim(),
      category ?? "",
      brand ?? "",
      sort && sort !== "relevance" ? sort : "",
    ].join("|");
    if (initialKeyRef.current !== null && initialKeyRef.current === requestKey) {
      initialKeyRef.current = null;
      if (initialResults) {
        searchStore.trackSearch({
          query: initialResults.query,
          resultCount: initialResults.total,
          source: "results-page",
        });
      }
      return;
    }
    initialKeyRef.current = null;

    async function run() {
      const hasFilter = Boolean(category?.trim() || brand?.trim());

      if (query.trim().length < MIN_QUERY_LENGTH && !hasFilter) {
        setResults({
          query: query.trim(),
          products: [],
          categories: [],
          brands: [],
          total: 0,
        });
        setStatus("idle");
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const data = await fetchSearchResults(query, {
          category,
          brand,
          sort,
        });
        if (cancelled) return;
        setResults(data);
        setStatus("success");
        searchStore.trackSearch({
          query: data.query,
          resultCount: data.total,
          source: "results-page",
        });
      } catch {
        if (cancelled) return;
        setStatus("error");
        setError("We could not load search results. Please try again.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query, category, brand, sort]);

  return { status, error, results };
}
