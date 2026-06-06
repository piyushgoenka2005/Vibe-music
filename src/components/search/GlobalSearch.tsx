"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearch } from "@/hooks/useSearch";
import { searchStore } from "@/store/searchStore";
import SearchOverlay from "./SearchOverlay";
import "./search.css";

const HEADER_INPUT_SELECTORS =
  "#sw-search-input, #autocomplete-0-input, #sw-search-input-mobile";

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

function bindHeaderSearch() {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(HEADER_INPUT_SELECTORS)
  );
  const forms = Array.from(
    document.querySelectorAll<HTMLFormElement>(
      ".assets-site-header__menu-search-form, #search-mount .aa-Form, .aa-Form"
    )
  );

  return { inputs, forms };
}

function isFullyBound(
  bound: WeakSet<Element>,
  inputs: HTMLInputElement[],
  forms: HTMLFormElement[]
): boolean {
  return (
    inputs.length > 0 &&
    inputs.every((input) => bound.has(input)) &&
    forms.every((form) => bound.has(form))
  );
}

export default function GlobalSearch() {
  const boundElementsRef = useRef<WeakSet<Element>>(new WeakSet());
  const handlersRef = useRef<{
    onHeaderFocus: EventListener;
    onHeaderInput: EventListener;
    onHeaderKeyDown: EventListener;
    onFormSubmit: EventListener;
  } | null>(null);

  const {
    query,
    status,
    error,
    groups,
    activeIndex,
    setQuery,
    setActiveIndex,
    openOverlay,
    closeOverlay,
    submitSearch,
    selectSuggestion,
    moveActiveIndex,
    handleEnter,
  } = useSearch();

  const syncNativeInputs = useCallback((value: string) => {
    document
      .querySelectorAll<HTMLInputElement>(HEADER_INPUT_SELECTORS)
      .forEach((input) => {
        if (input.value !== value) input.value = value;
      });
  }, []);

  const onHeaderFocus = useCallback(
    (event: FocusEvent) => {
      const target = event.target as HTMLInputElement;
      const rect = target.getBoundingClientRect();
      const value = target.value ?? "";
      setQuery(value);
      syncNativeInputs(value);
      openOverlay(rect, target.id, isMobileViewport());
    },
    [openOverlay, setQuery, syncNativeInputs]
  );

  const onHeaderInput = useCallback(
    (event: Event) => {
      const target = event.target as HTMLInputElement;
      setQuery(target.value);
    },
    [setQuery]
  );

  const onHeaderKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLInputElement;
      if (!searchStore.getState().isOverlayOpen) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const rect = target.getBoundingClientRect();
          openOverlay(rect, target.id, isMobileViewport());
        }
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActiveIndex(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActiveIndex(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        handleEnter();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeOverlay();
        target.blur();
      }
    },
    [closeOverlay, handleEnter, moveActiveIndex, openOverlay]
  );

  const onFormSubmit = useCallback(
    (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      submitSearch();
    },
    [submitSearch]
  );

  useEffect(() => {
    handlersRef.current = {
      onHeaderFocus: onHeaderFocus as EventListener,
      onHeaderInput: onHeaderInput as EventListener,
      onHeaderKeyDown: onHeaderKeyDown as EventListener,
      onFormSubmit: onFormSubmit as EventListener,
    };
  }, [onHeaderFocus, onHeaderInput, onHeaderKeyDown, onFormSubmit]);

  useEffect(() => {
    searchStore.hydrate();
  }, []);

  useEffect(() => {
    syncNativeInputs(query);
  }, [query, syncNativeInputs]);

  useEffect(() => {
    let observer: MutationObserver | null = null;

    function attach(): boolean {
      const handlers = handlersRef.current;
      if (!handlers) return false;

      const { inputs, forms } = bindHeaderSearch();

      inputs.forEach((input) => {
        if (input.placeholder === "Loading...") {
          input.placeholder = "Search for sweet gear";
        }

        if (boundElementsRef.current.has(input)) return;

        input.addEventListener("focus", handlers.onHeaderFocus, true);
        input.addEventListener("input", handlers.onHeaderInput, true);
        input.addEventListener("keydown", handlers.onHeaderKeyDown, true);
        boundElementsRef.current.add(input);
      });

      forms.forEach((form) => {
        if (boundElementsRef.current.has(form)) return;
        form.addEventListener("submit", handlers.onFormSubmit, true);
        boundElementsRef.current.add(form);
      });

      return isFullyBound(boundElementsRef.current, inputs, forms);
    }

    function stopWatching() {
      observer?.disconnect();
      observer = null;
    }

    if (attach()) {
      return;
    }

    const headerSection = document.querySelector(
      '[data-sweetwater-section="header"]'
    );
    if (!headerSection) return;

    observer = new MutationObserver(() => {
      if (attach()) {
        stopWatching();
      }
    });
    observer.observe(headerSection, { childList: true, subtree: true });

    return () => {
      stopWatching();
    };
  }, []);

  const onOverlayKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveIndex(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveIndex(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleEnter();
    }
  };

  return (
    <div className="sw-search-system">
      <SearchOverlay
        query={query}
        status={status}
        error={error}
        groups={groups}
        activeIndex={activeIndex}
        onQueryChange={setQuery}
        onClose={closeOverlay}
        onSubmit={submitSearch}
        onSelect={selectSuggestion}
        onHover={setActiveIndex}
        onKeyDown={onOverlayKeyDown}
      />
    </div>
  );
}
