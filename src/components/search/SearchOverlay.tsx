"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { useSearchStore } from "@/store/searchStore";
import type { SearchStatus, SearchSuggestionGroups } from "@/types/search";
import SearchAutocomplete from "./SearchAutocomplete";

const HEADER_INPUT_SELECTORS =
  "#vibe-search-input, #sw-search-input, #autocomplete-0-input, #sw-search-input-mobile";

interface SearchOverlayProps {
  query: string;
  status: SearchStatus;
  error: string | null;
  groups: SearchSuggestionGroups;
  activeIndex: number;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onSelect: (suggestion: import("@/types/search").SearchSuggestion) => void;
  onHover: (index: number) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function isHeaderSearchTarget(target: Node): boolean {
  const inputs = document.querySelectorAll(HEADER_INPUT_SELECTORS);
  for (const input of inputs) {
    if (input.contains(target)) return true;
  }
  return false;
}

export default function SearchOverlay({
  query,
  status,
  error,
  groups,
  activeIndex,
  onQueryChange,
  onClose,
  onSubmit,
  onSelect,
  onHover,
  onKeyDown,
}: SearchOverlayProps) {
  const isOverlayOpen = useSearchStore((s) => s.isOverlayOpen);
  const isMobile = useSearchStore((s) => s.isMobile);
  const anchorRect = useSearchStore((s) => s.anchorRect);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (!isOverlayOpen || isMobile) return;
    inputRef.current?.focus();
  }, [isMobile, isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (isHeaderSearchTarget(target)) return;
      onClose();
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOverlayOpen, onClose]);

  if (!isOverlayOpen || !isClient) return null;

  const panelStyle =
    !isMobile && anchorRect
      ? {
          position: "fixed" as const,
          top: anchorRect.bottom + 4,
          left: anchorRect.left,
          width: Math.max(anchorRect.width, 520),
          zIndex: 100001,
        }
      : undefined;

  const overlay = (
    <div
      className={`sw-search-overlay${isMobile ? "" : " sw-search-overlay--desktop"}`}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={`sw-search-panel${isMobile ? " sw-search-panel--mobile" : ""}`}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        {isMobile ? (
          <div className="sw-search-panel__header">
            <input
              ref={inputRef}
              type="search"
              className="sw-search-panel__input"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search for sweet gear"
              aria-label="Search for sweet gear"
              autoComplete="off"
            />
            <button
              type="button"
              className="sw-search-panel__close"
              onClick={onClose}
              aria-label="Close search"
            >
              Close
            </button>
          </div>
        ) : null}

        <SearchAutocomplete
          query={query}
          status={status}
          error={error}
          groups={groups}
          activeIndex={activeIndex}
          onSelect={onSelect}
          onHover={onHover}
        />

        {isMobile ? (
          <div
            className="sw-search-panel__header"
            style={{ borderTop: "1px solid #e5e4e3" }}
          >
            <button
              type="button"
              className="sw-search-panel__close"
              style={{ color: "#0072ba", fontWeight: 700 }}
              onClick={onSubmit}
            >
              Search
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
