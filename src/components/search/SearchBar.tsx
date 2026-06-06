"use client";

import { FormEvent } from "react";
import { useSearch } from "@/hooks/useSearch";

interface SearchBarProps {
  autoFocus?: boolean;
  className?: string;
}

export default function SearchBar({ autoFocus = false, className = "" }: SearchBarProps) {
  const { query, setQuery, submitSearch } = useSearch();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSearch();
  }

  return (
    <form
      className={`sw-search-bar ${className}`.trim()}
      role="search"
      onSubmit={onSubmit}
    >
      <label className="sw-search-bar__label" htmlFor="sw-search-landing-input">
        Search for sweet gear
      </label>
      <div className="sw-search-bar__wrap">
        <input
          id="sw-search-landing-input"
          type="search"
          className="sw-search-panel__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for sweet gear"
          aria-label="Search for sweet gear"
          autoFocus={autoFocus}
          autoComplete="off"
          minLength={2}
        />
        <button type="submit" className="sw-search-bar__submit">
          Search
        </button>
      </div>
    </form>
  );
}
