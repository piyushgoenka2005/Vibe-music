"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { useSearchStore } from "@/store/searchStore";
import type { SearchStatus, SearchSuggestionGroups } from "@/types/search";
import SearchAutocomplete from "./SearchAutocomplete";

const HEADER_INPUT_SELECTORS =
  "#sw-search-input, #autocomplete-0-input, #sw-search-input-mobile, .assets-site-header__menu-search-typeahead-field, .site-header__search-input";

interface SearchOverlayProps {
  query: string;
  status: SearchStatus;
  error: string | null;
  groups: SearchSuggestionGroups;
  activeIndex: number;
  activeDescendantId?: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onSelect: (suggestion: import("@/types/search").SearchSuggestion) => void;
  onHover: (index: number) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function isHeaderSearchTarget(target: Node): boolean {
  const element = target as Element;
  if (!element) return false;
  if (element.closest?.(".site-header__search-toggle")) return true;
  if (element.closest?.(".site-header__search, .assets-site-header__menu-search-form")) return true;

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
  activeDescendantId,
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
    if (!isOverlayOpen || !isMobile) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [isMobile, isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen) return;

    function handleOutsideInteraction(event: Event) {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (isHeaderSearchTarget(target)) return;

      onClose();
      document
        .querySelectorAll<HTMLInputElement>(HEADER_INPUT_SELECTORS)
        .forEach((input) => input.blur());
    }

    function handleScroll(event: Event) {
      const target = event.target as Node | null;
      // Keep dropdown open if user is scrolling inside the suggestions list
      if (target && panelRef.current?.contains(target)) return;

      onClose();
      document
        .querySelectorAll<HTMLInputElement>(HEADER_INPUT_SELECTORS)
        .forEach((input) => input.blur());
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        document
          .querySelectorAll<HTMLInputElement>(HEADER_INPUT_SELECTORS)
          .forEach((input) => input.blur());
      }
    }

    document.addEventListener("pointerdown", handleOutsideInteraction, true);
    document.addEventListener("mousedown", handleOutsideInteraction, true);
    document.addEventListener("touchstart", handleOutsideInteraction, {
      capture: true,
      passive: true,
    });
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideInteraction, true);
      document.removeEventListener("mousedown", handleOutsideInteraction, true);
      document.removeEventListener("touchstart", handleOutsideInteraction, true);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOverlayOpen, onClose]);

  if (!isOverlayOpen || !isClient) return null;

  const panelStyle =
    !isMobile && anchorRect
      ? {
          position: "fixed" as const,
          top: anchorRect.bottom,
          left: anchorRect.left,
          width: anchorRect.width,
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
        className={`sw-search-panel${isMobile ? " sw-search-panel--mobile" : " sw-search-panel--anchored"}`}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        {isMobile ? (
          <div className="sw-search-panel__header sw-search-panel__header--brand">
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              className="sw-search-panel__input"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search for sweet gear"
              aria-label="Search for sweet gear"
              aria-autocomplete="list"
              aria-controls="sw-search-panel-listbox"
              aria-expanded="true"
              aria-activedescendant={activeDescendantId}
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
          onSubmit={onSubmit}
        />

        {isMobile ? (
          <div className="sw-search-panel__header" style={{ borderTop: "1px solid #e5e4e3" }}>
            <button
              type="button"
              className="sw-search-panel__close"
              style={{ color: "var(--brand-primary)", fontWeight: 700 }}
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
