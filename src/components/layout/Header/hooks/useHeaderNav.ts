"use client";

import { useEffect } from "react";

const DESKTOP_CLASS = "assets-site-nav--desktop";
const MOBILE_CLASS = "assets-site-nav--mobile";
const ACTIVE_CLASS = "assets-site-nav--active";

function applyViewportNavClass() {
  const header = document.getElementById("assets-header");
  const nav = document.querySelector(".assets-site-header__nav");
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const body = document.body;

  body.classList.remove(DESKTOP_CLASS, MOBILE_CLASS);
  header?.classList.remove(DESKTOP_CLASS);
  nav?.classList.remove(DESKTOP_CLASS);

  if (isDesktop) {
    body.classList.add(DESKTOP_CLASS);
    header?.classList.add(DESKTOP_CLASS);
    nav?.classList.add(DESKTOP_CLASS);
  } else {
    body.classList.add(MOBILE_CLASS);
  }
}

function closeMobileNav() {
  const body = document.body;
  const nav = document.querySelector(".assets-site-header__nav");
  const toggle = document.querySelector(".assets-site-header__menu-nav-toggle");

  body.classList.remove(ACTIVE_CLASS, "hide-overflow");
  nav?.classList.remove("assets-site-header__nav--active");
  toggle?.classList.remove("assets-site-header__menu-nav-toggle--close");

  const activeSelectors = [
    ".assets-site-header__nav-menu-category--active",
    ".assets-site-header__nav-menu-used--active",
    ".assets-site-header__nav-menu-dz--active",
    ".assets-site-header__nav-menu-support--active",
    ".assets-site-header__nav-menu-account--active",
    ".assets-site-header__nav-menu-contact--active",
    ".assets-site-header__nav-menu-item--active",
  ];

  activeSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      const activeClass = selector.slice(1);
      el.classList.remove(activeClass);
    });
  });
}

function toggleMobileNav() {
  const body = document.body;
  const nav = document.querySelector(".assets-site-header__nav");
  const toggle = document.querySelector(".assets-site-header__menu-nav-toggle");

  if (!nav || !toggle) return;

  const isOpen = nav.classList.contains("assets-site-header__nav--active");

  if (isOpen) {
    closeMobileNav();
    return;
  }

  body.classList.add(ACTIVE_CLASS, "hide-overflow");
  nav.classList.add("assets-site-header__nav--active");
  toggle.classList.add("assets-site-header__menu-nav-toggle--close");
}

function togglePanel(selector: string, activeClass: string) {
  const panel = document.querySelector(selector);
  panel?.classList.toggle(activeClass);
}

export function useHeaderNav() {
  useEffect(() => {
    applyViewportNavClass();

    const onResize = () => applyViewportNavClass();
    window.addEventListener("resize", onResize);

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const navItems = document.querySelector(".assets-site-header__nav-items");
      const nav = document.querySelector(
        ".assets-site-header__nav.assets-site-header__nav--active"
      );
      const magnifier = document.querySelector(
        ".assets-site-header__menu-magnifying-glass-wrap"
      );

      if (
        nav &&
        navItems &&
        nav.contains(target) &&
        !navItems.contains(target)
      ) {
        closeMobileNav();
        return;
      }

      if (magnifier?.contains(target)) {
        closeMobileNav();
      }
    };

    const onHeaderClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest(".assets-site-header__menu-nav-toggle")) {
        event.preventDefault();
        toggleMobileNav();
        if (
          document
            .querySelector(".assets-site-header__nav")
            ?.classList.contains("assets-site-header__nav--active")
        ) {
          document.addEventListener("click", onDocumentClick);
        } else {
          document.removeEventListener("click", onDocumentClick);
        }
        return;
      }

      if (window.matchMedia("(min-width: 768px)").matches) return;

      const navItem = target.closest(".assets-site-header__nav-menu-item-link");
      if (!navItem) return;

      const parentItem = navItem.closest(".assets-site-header__nav-menu-item");
      if (!parentItem?.querySelector(".assets-site-header__nav-sub-menu")) return;

      event.preventDefault();
      parentItem.classList.toggle("assets-site-header__nav-menu-item--active");
    };

    const header = document.getElementById("assets-header");
    header?.addEventListener("click", onHeaderClick);

    const usedTrigger = document.querySelector(".assets-site-header__nav-used");
    usedTrigger?.addEventListener("click", (event) => {
      if (window.matchMedia("(min-width: 768px)").matches) return;
      event.preventDefault();
      togglePanel(
        ".assets-site-header__nav-menu-used",
        "assets-site-header__nav-menu-used--active"
      );
    });

    const dzTrigger = document.querySelector(".assets-site-header__nav-dz");
    dzTrigger?.addEventListener("click", (event) => {
      if (window.matchMedia("(min-width: 768px)").matches) return;
      event.preventDefault();
      togglePanel(
        ".assets-site-header__nav-menu-dz",
        "assets-site-header__nav-menu-dz--active"
      );
    });

    const overlay = document.querySelector(".assets-search-menu-overlay");
    overlay?.addEventListener("click", closeMobileNav);

    const dismissLanguage = document.querySelector(
      ".sp-language__notice-dismiss"
    );
    dismissLanguage?.addEventListener("click", () => {
      document
        .querySelector("#assets-site-header__sp-language")
        ?.classList.add("removed");
    });

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onDocumentClick);
      header?.removeEventListener("click", onHeaderClick);
    };
  }, []);
}
