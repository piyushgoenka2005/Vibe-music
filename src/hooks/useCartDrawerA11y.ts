"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focus trap + Escape close + restore focus for dialogs/drawers. */
export function useDialogA11y(open: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    let removeTabTrap: (() => void) | undefined;
    let frame2 = 0;

    function getFocusables(container: HTMLElement) {
      return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter(
        (node) => !node.hasAttribute("disabled") && node.offsetParent !== null
      );
    }

    function attachTabTrap(container: HTMLElement) {
      const focusables = getFocusables(container);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      window.requestAnimationFrame(() => {
        (first ?? container).focus();
      });

      if (!container.hasAttribute("tabindex")) {
        container.setAttribute("tabindex", "-1");
      }

      function onTab(event: KeyboardEvent) {
        if (event.key !== "Tab" || focusables.length === 0) return;

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
          return;
        }

        if (document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }

      container.addEventListener("keydown", onTab);
      removeTabTrap = () => container.removeEventListener("keydown", onTab);
    }

    function tryAttachTrap() {
      const container = containerRef.current;
      if (!container) return false;
      attachTabTrap(container);
      return true;
    }

    const frame1 = window.requestAnimationFrame(() => {
      if (tryAttachTrap()) return;
      frame2 = window.requestAnimationFrame(() => {
        tryAttachTrap();
      });
    });

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }

    document.addEventListener("keydown", onEscape);

    return () => {
      window.cancelAnimationFrame(frame1);
      window.cancelAnimationFrame(frame2);
      document.removeEventListener("keydown", onEscape);
      removeTabTrap?.();
      triggerRef.current?.focus();
    };
  }, [open, onClose]);

  return containerRef;
}

/** @deprecated Prefer useDialogA11y — kept for existing cart drawer import. */
export const useCartDrawerA11y = useDialogA11y;
