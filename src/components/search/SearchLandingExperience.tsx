"use client";

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Search } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import {
  SEARCH_LANDING_QUICK_CHIPS,
  SEARCH_LANDING_TRENDING,
} from "@/data/searchLandingHints";
import SearchAutocomplete from "@/components/search/SearchAutocomplete";
import SearchLandingRollingPlaceholder, {
  SEARCH_LANDING_INPUT_ID,
} from "@/components/search/SearchLandingRollingPlaceholder";
import { searchStore } from "@/store/searchStore";

interface SearchLandingExperienceProps {
  autoFocus?: boolean;
}

export default function SearchLandingExperience({
  autoFocus = false,
}: SearchLandingExperienceProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const {
    query,
    status,
    error,
    groups,
    activeIndex,
    setQuery,
    setActiveIndex,
    submitSearch,
    selectSuggestion,
    moveActiveIndex,
    handleEnter,
    recentSearches,
  } = useSearch({ inlineSuggestions: isFocused || showPanel });

  useEffect(() => {
    searchStore.hydrate();
  }, []);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!showPanel) return undefined;

    function onPointerDown(event: MouseEvent) {
      if (shellRef.current?.contains(event.target as Node)) return;
      setShowPanel(false);
      setIsFocused(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showPanel]);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitSearch();
    },
    [submitSearch]
  );

  const onInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActiveIndex(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActiveIndex(-1);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        handleEnter();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setShowPanel(false);
        setIsFocused(false);
        inputRef.current?.blur();
      }
    },
    [handleEnter, moveActiveIndex]
  );

  const onTrendingClick = useCallback(
    (term: string) => {
      setQuery(term);
      submitSearch(term);
    },
    [setQuery, submitSearch]
  );

  const showRollingPlaceholder = !query && !isFocused;
  const panelOpen = showPanel && (isFocused || query.length > 0);

  return (
    <div ref={shellRef} className="sw-search-landing-bar">
      <form
        className="sw-search-landing-bar__form"
        role="search"
        onSubmit={onSubmit}
      >
        <div
          className={`sw-search-landing-bar__glow${isFocused ? " sw-search-landing-bar__glow--focused" : ""}`}
        >
          <span className="sw-search-landing-bar__glow-lines" aria-hidden="true">
            <span className="sw-search-landing-bar__glow-line sw-search-landing-bar__glow-line--start" />
            <span className="sw-search-landing-bar__glow-line sw-search-landing-bar__glow-line--end" />
          </span>
          <div
            className={`sw-search-landing-bar__shell${isFocused ? " sw-search-landing-bar__shell--focused" : ""}`}
          >
          <span className="sw-search-landing-bar__icon" aria-hidden="true">
            <Search size={20} strokeWidth={2.25} />
          </span>

          <div className="sw-search-landing-bar__field">
            <SearchLandingRollingPlaceholder visible={showRollingPlaceholder} />
            <input
              ref={inputRef}
              id={SEARCH_LANDING_INPUT_ID}
              type="search"
              className="sw-search-landing-bar__input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setShowPanel(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={onInputKeyDown}
              placeholder={showRollingPlaceholder ? " " : "Search products, brands, categories…"}
              aria-label="Search Vibe Music for products, brands, and categories"
              autoFocus={autoFocus}
              autoComplete="off"
              minLength={2}
              aria-expanded={panelOpen}
              aria-controls="sw-search-landing-panel"
              aria-autocomplete="list"
            />
          </div>

          <kbd className="sw-search-landing-bar__shortcut" aria-hidden="true">
            /
          </kbd>

          <button type="submit" className="sw-search-landing-bar__submit">
            Search
          </button>
          </div>
        </div>

        {panelOpen ? (
          <div
            id="sw-search-landing-panel"
            className="sw-search-landing-bar__panel"
            role="region"
            aria-label="Search suggestions"
          >
            <SearchAutocomplete
              query={query}
              status={status}
              error={error}
              groups={groups}
              activeIndex={activeIndex}
              onSelect={(suggestion) => {
                selectSuggestion(suggestion);
                setShowPanel(false);
              }}
              onHover={setActiveIndex}
            />
          </div>
        ) : null}
      </form>

      <div className="sw-search-landing-bar__discover">
        <p className="sw-search-landing-bar__discover-label">Browse by category</p>
        <div className="sw-search-landing-bar__chips">
          {SEARCH_LANDING_QUICK_CHIPS.map((chip) => (
            <a key={chip.label} href={chip.href} className="sw-search-landing-bar__chip">
              {chip.label}
            </a>
          ))}
        </div>
      </div>

      {recentSearches.length > 0 ? (
        <div className="sw-search-landing-bar__discover">
          <p className="sw-search-landing-bar__discover-label">Recent searches</p>
          <div className="sw-search-landing-bar__chips">
            {recentSearches.slice(0, 5).map((term) => (
              <button
                key={term}
                type="button"
                className="sw-search-landing-bar__chip sw-search-landing-bar__chip--ghost"
                onClick={() => onTrendingClick(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="sw-search-landing-bar__discover">
          <p className="sw-search-landing-bar__discover-label">Trending now</p>
          <div className="sw-search-landing-bar__chips">
            {SEARCH_LANDING_TRENDING.map((term) => (
              <button
                key={term}
                type="button"
                className="sw-search-landing-bar__chip sw-search-landing-bar__chip--ghost"
                onClick={() => onTrendingClick(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
