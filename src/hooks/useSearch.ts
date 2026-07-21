"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { trackSearch } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/routes";
import { buildEmptyStateSuggestions } from "@/lib/search/searchIntelligence";
import {
  buildClientSearchSuggestions,
  buildPopularQueriesFromStore,
  fetchSearchResults,
  fetchSearchSuggestions,
  mapRecentlyViewedSuggestions,
  MIN_QUERY_LENGTH,
  SEARCH_EMPTY_GROUPS,
} from "@/services/search.service";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import { searchStore, useSearchStore } from "@/store/searchStore";
import type {
  SearchResultsData,
  SearchStatus,
  SearchSuggestion,
  SearchSuggestionGroups,
} from "@/types/search";

const HEADER_SEARCH_INPUT_SELECTORS =
  "#sw-search-input, #sw-search-input-mobile, #autocomplete-0-input, .assets-site-header__menu-search-typeahead-field, .site-header__search-input";

function readHeaderSearchQuery(): string {
  if (typeof document === "undefined") return "";

  const focused = document.querySelector<HTMLInputElement>(
    `${HEADER_SEARCH_INPUT_SELECTORS}:focus`
  );
  if (focused?.value.trim()) return focused.value.trim();

  for (const selector of HEADER_SEARCH_INPUT_SELECTORS.split(", ")) {
    const input = document.querySelector<HTMLInputElement>(selector);
    if (input?.value.trim()) return input.value.trim();
  }

  return "";
}

function flattenSuggestions(groups: SearchSuggestionGroups): SearchSuggestion[] {
  return [
    ...groups.keywords,
    ...groups.categories,
    ...groups.brands,
    ...groups.products,
    ...groups.recentlyViewed,
    ...groups.recent,
  ];
}

function hasSuggestions(groups: SearchSuggestionGroups): boolean {
  return (
    groups.keywords.length +
      groups.categories.length +
      groups.brands.length +
      groups.products.length +
      groups.recentlyViewed.length +
      groups.recent.length >
    0
  );
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
  const analytics = useSearchStore((s) => s.analytics);
  const isOverlayOpen = useSearchStore((s) => s.isOverlayOpen);
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.productIds);
  const suggestionsActive = isOverlayOpen || inlineSuggestions;

  const debouncedQuery = useDebounce(query, 300);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SearchSuggestionGroups>(SEARCH_EMPTY_GROUPS);
  const [activeIndex, setActiveIndex] = useState(-1);

  const popularQueries = useMemo(
    () => buildPopularQueriesFromStore(analytics),
    [analytics]
  );

  const suggestionOptions = useMemo(
    () => ({
      recentlyViewedIds,
      popularQueries,
    }),
    [recentlyViewedIds, popularQueries]
  );

  const flatSuggestions = useMemo(() => flattenSuggestions(groups), [groups]);

  useEffect(() => {
    if (!suggestionsActive) return;

    let cancelled = false;

    async function run() {
      if (debouncedQuery.length === 0) {
        setStatus("success");
        setError(null);
        const recent = recentSearches.slice(0, 5).map((item, index) => ({
          id: `recent-${index}`,
          type: "recent" as const,
          label: item,
          href: `${ROUTES.searchResults}?q=${encodeURIComponent(item)}`,
        }));
        const recentlyViewed = await mapRecentlyViewedSuggestions(
          recentlyViewedIds,
          ""
        );
        if (cancelled) return;

        if (recent.length === 0 && recentlyViewed.length === 0) {
          const discovery = buildEmptyStateSuggestions();
          setGroups({
            keywords: discovery.trending,
            categories: discovery.categories,
            brands: discovery.brands,
            products: [],
            recentlyViewed: [],
            recent: [],
          });
        } else {
          setGroups({
            ...SEARCH_EMPTY_GROUPS,
            recentlyViewed,
            recent,
          });
        }
        setActiveIndex(-1);
        return;
      }

      if (debouncedQuery.length < MIN_QUERY_LENGTH) {
        setStatus("success");
        setError(null);
        try {
          const next = await fetchSearchSuggestions(
            debouncedQuery,
            recentSearches,
            suggestionOptions
          );
          if (cancelled) return;
          setGroups(next);
          setActiveIndex(-1);
        } catch {
          if (cancelled) return;
          setGroups(SEARCH_EMPTY_GROUPS);
          setActiveIndex(-1);
        }
        return;
      }

      const clientGroups = buildClientSearchSuggestions(
        debouncedQuery,
        recentSearches,
        suggestionOptions
      );
      setGroups(clientGroups);
      setStatus("loading");
      setError(null);

      try {
        const next = await fetchSearchSuggestions(
          debouncedQuery,
          recentSearches,
          suggestionOptions
        );
        if (cancelled) return;
        setGroups(next);
        setStatus("success");
        setActiveIndex(-1);
      } catch {
        if (cancelled) return;
        setGroups({
          ...clientGroups,
          recent: recentSearches
            .filter((item) =>
              item.toLowerCase().includes(debouncedQuery.toLowerCase())
            )
            .slice(0, 3)
            .map((item, index) => ({
              id: `recent-match-${index}`,
              type: "recent" as const,
              label: item,
              href: `${ROUTES.searchResults}?q=${encodeURIComponent(item)}`,
            })),
        });
        setStatus("success");
        setError(null);
        setActiveIndex(-1);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, recentSearches, recentlyViewedIds, suggestionOptions, suggestionsActive]);

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
      const next = String(value ?? readHeaderSearchQuery() ?? query ?? "").trim();
      if (next.length < MIN_QUERY_LENGTH) return;
      searchStore.setQuery(next);
      searchStore.addRecentSearch(next);
      trackSearch(next);
      closeOverlay();
      router.push(`${ROUTES.searchResults}?q=${encodeURIComponent(next)}`);
    },
    [closeOverlay, query, router]
  );

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      searchStore.addRecentSearch(suggestion.label);
      if (
        (suggestion.type === "product" || suggestion.type === "viewed") &&
        suggestion.productSlug
      ) {
        searchStore.trackSearchClick({
          query: query.trim() || suggestion.label,
          productId: suggestion.id.replace(/^viewed-/, ""),
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

  const activeDescendantId =
    activeIndex >= 0 ? `sw-search-option-${activeIndex}` : undefined;

  return {
    query,
    debouncedQuery,
    status,
    error,
    groups,
    flatSuggestions,
    activeIndex,
    activeDescendantId,
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
    hasSuggestions: hasSuggestions(groups),
  };
}

export function useSearchResults(
  query: string,
  filters?: {
    category?: string;
    subcategory?: string;
    brand?: string;
    sort?: string;
    all?: boolean;
  },
  options?: {
    /** Server-rendered results matching the initial query/filters. */
    initialResults?: SearchResultsData | null;
    initialFilters?: {
      category?: string;
      subcategory?: string;
      brand?: string;
    };
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
  const subcategory = filters?.subcategory;
  const brand = filters?.brand;
  const sort = filters?.sort;
  const all = filters?.all === true;
  const initialKeyRef = useRef<string | null>(
    initialResults
      ? [
          query.trim(),
          options?.initialFilters?.category ?? "",
          options?.initialFilters?.subcategory ?? "",
          all ? "" : (options?.initialFilters?.brand ?? ""),
          all ? "all" : "",
        ].join("|")
      : null
  );

  useEffect(() => {
    let cancelled = false;

    // Server already rendered these exact results — skip the duplicate fetch.
    const requestKey = [
      query.trim(),
      category ?? "",
      subcategory ?? "",
      all ? "" : (brand ?? ""),
      all ? "all" : sort && sort !== "relevance" ? sort : "",
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
      const hasFilter = Boolean(
        category?.trim() ||
          subcategory?.trim() ||
          (!all && brand?.trim())
      );

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
          subcategory,
          brand: all ? undefined : brand,
          sort: all ? undefined : sort,
          all,
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
  }, [query, category, subcategory, brand, sort, all, initialResults]);

  return { status, error, results };
}
