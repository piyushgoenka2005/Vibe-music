"use client";

import { useEffect } from "react";

const ADA_TARGETS = [
  { id: "ada-item-1", selector: "#main-content" },
  { id: "ada-item-0", selector: "#sw-search-input, #autocomplete-0-input" },
  { id: "ada-item-2", selector: "#assets-footer" },
  { id: "ada-item-3", selector: "#twilio-webchat-widget-root" },
] as const;

export function useAdaMenu() {
  useEffect(() => {
    function syncAdaItems() {
      ADA_TARGETS.forEach(({ id, selector }) => {
        const item = document.getElementById(id);
        if (item?.hidden && document.querySelector(selector)) {
          item.hidden = false;
        }
      });
    }

    syncAdaItems();

    const observer = new MutationObserver(syncAdaItems);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);
}
