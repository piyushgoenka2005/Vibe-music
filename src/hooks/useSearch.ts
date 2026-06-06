"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export function useSearch() {
  const router = useRouter();
  const query = useSearchStore((s) => s.query);
  const recentSearches = useSearchStore((s) => s.recentSearches);
  const isOverlayOpen = useSearchStore((s) => s.isOverlayOpen);

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
    if (!isOverlayOpen) return;

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
  }, [debouncedQuery, isOverlayOpen, recentSearches]);

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
      searchStore.trackSearch({
        query: next,
        resultCount: 0,
        source: "submit",
      });
      closeOverlay();
      router.push(`/search/results?q=${encodeURIComponent(next)}`);
    },
    [closeOverlay, query, router]
  );

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      searchStore.addRecentSearch(suggestion.label);
      closeOverlay();
      router.push(suggestion.href);
    },
    [closeOverlay, router]
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
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }
) {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultsData | null>(null);
  const category = filters?.category;
  const brand = filters?.brand;
  const minPrice = filters?.minPrice;
  const maxPrice = filters?.maxPrice;
  const sort = filters?.sort;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (query.trim().length < MIN_QUERY_LENGTH) {
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
          minPrice,
          maxPrice,
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
  }, [query, category, brand, minPrice, maxPrice, sort]);

  return { status, error, results };
}
