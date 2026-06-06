"use client";

import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="search-bar">
      <form action="/search/results" method="get" className="vibe-header-search-form">
        <span className="search-icon" aria-hidden="true">
          <Search size={16} strokeWidth={2} />
        </span>
        <input
          type="text"
          id="vibe-search-input"
          name="q"
          placeholder="Search for sweet gear"
          autoComplete="off"
          aria-label="Search for sweet gear"
        />
      </form>
    </div>
  );
}
