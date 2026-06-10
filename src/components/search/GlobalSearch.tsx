"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearch } from "@/hooks/useSearch";
import { searchStore } from "@/store/searchStore";
import SearchOverlay from "./SearchOverlay";
import "./search.css";

const HEADER_INPUT_SELECTORS =
  "#sw-search-input, #autocomplete-0-input, #sw-search-input-mobile, .assets-site-header__menu-search-typeahead-field";

const HEADER_FORM_SELECTORS =
  ".assets-site-header__menu-search-form, #search-mount .aa-Form, .aa-Form";

const HEADER_SUBMIT_SELECTORS =
  ".assets-site-header__menu-search-submit, .aa-SubmitButton";

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

/** Show the classic typeahead field; hide the disabled federated-search mount. */
export function activateHeaderSearch() {
  const searchMount = document.getElementById("search-mount");
  const classic = document.querySelector<HTMLElement>(
    "[classic-search-container]"
  );

  if (searchMount) {
    searchMount.style.display = "none";
  }
  if (classic) {
    classic.style.removeProperty("display");
  }

  document
    .querySelectorAll<HTMLInputElement>(HEADER_INPUT_SELECTORS)
    .forEach((input) => {
      input.disabled = false;
      input.removeAttribute("disabled");
      if (!input.placeholder || input.placeholder === "Loading...") {
        input.placeholder = "Search for sweet gear";
      }
    });

  document.querySelectorAll(".federated-search--loading").forEach((el) => {
    el.classList.remove("federated-search--loading");
  });
}

function bindHeaderSearch() {
  activateHeaderSearch();

  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(HEADER_INPUT_SELECTORS)
  ).filter((input) => !input.disabled && input.offsetParent !== null);

  const forms = Array.from(
    document.querySelectorAll<HTMLFormElement>(HEADER_FORM_SELECTORS)
  );

  const submitButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(HEADER_SUBMIT_SELECTORS)
  );

  return { inputs, forms, submitButtons };
}

function isFullyBound(
  bound: WeakSet<Element>,
  inputs: HTMLInputElement[],
  forms: HTMLFormElement[],
  submitButtons: HTMLButtonElement[]
): boolean {
  return (
    inputs.length > 0 &&
    inputs.every((input) => bound.has(input)) &&
    forms.every((form) => bound.has(form)) &&
    submitButtons.every((button) => bound.has(button))
  );
}

export default function GlobalSearch() {
  const boundElementsRef = useRef<WeakSet<Element>>(new WeakSet());
  const handlersRef = useRef<{
    onHeaderFocus: EventListener;
    onHeaderInput: EventListener;
    onHeaderKeyDown: EventListener;
    onFormSubmit: EventListener;
    onSubmitClick: EventListener;
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

  const getSearchAnchorRect = useCallback((input: HTMLInputElement) => {
    const form = input.closest<HTMLElement>(
      ".assets-site-header__menu-search-form"
    );
    return (form ?? input).getBoundingClientRect();
  }, []);

  const onHeaderFocus = useCallback(
    (event: FocusEvent) => {
      const target = event.target as HTMLInputElement;
      const rect = getSearchAnchorRect(target);
      const value = target.value ?? "";
      setQuery(value);
      syncNativeInputs(value);
      openOverlay(rect, target.id, isMobileViewport());
    },
    [getSearchAnchorRect, openOverlay, setQuery, syncNativeInputs]
  );

  const onHeaderInput = useCallback(
    (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value ?? "";
      setQuery(value);
      syncNativeInputs(value);
      if (!searchStore.getState().isOverlayOpen) {
        const rect = getSearchAnchorRect(target);
        openOverlay(rect, target.id, isMobileViewport());
      }
    },
    [getSearchAnchorRect, openOverlay, setQuery, syncNativeInputs]
  );

  const onHeaderKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLInputElement;
      if (!searchStore.getState().isOverlayOpen) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const rect = getSearchAnchorRect(target);
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
    [closeOverlay, getSearchAnchorRect, handleEnter, moveActiveIndex, openOverlay]
  );

  const onFormSubmit = useCallback(
    (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      submitSearch();
    },
    [submitSearch]
  );

  const onSubmitClick = useCallback(
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
      onSubmitClick: onSubmitClick as EventListener,
    };
  }, [
    onHeaderFocus,
    onHeaderInput,
    onHeaderKeyDown,
    onFormSubmit,
    onSubmitClick,
  ]);

  useEffect(() => {
    searchStore.hydrate();
  }, []);

  useEffect(() => {
    syncNativeInputs(query);
  }, [query, syncNativeInputs]);

  useEffect(() => {
    function attach(): boolean {
      const handlers = handlersRef.current;
      if (!handlers) return false;

      const { inputs, forms, submitButtons } = bindHeaderSearch();

      inputs.forEach((input) => {
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

      submitButtons.forEach((button) => {
        if (boundElementsRef.current.has(button)) return;
        button.addEventListener("click", handlers.onSubmitClick, true);
        boundElementsRef.current.add(button);
      });

      return isFullyBound(
        boundElementsRef.current,
        inputs,
        forms,
        submitButtons
      );
    }

    const onHeaderReady = () => {
      attach();
    };

    attach();

    const headerSection = document.querySelector(
      '[data-vibe-section="header"]'
    );
    const observer = headerSection
      ? new MutationObserver(() => {
          attach();
        })
      : null;

    observer?.observe(headerSection!, { childList: true, subtree: true });
    window.addEventListener("vibe:header-ready", onHeaderReady);

    return () => {
      observer?.disconnect();
      window.removeEventListener("vibe:header-ready", onHeaderReady);
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
