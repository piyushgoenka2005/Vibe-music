"use client";

import { useEffect } from "react";

function toggleMobileNav(open: boolean) {
  const header = document.getElementById("assets-header");
  const nav = document.querySelector(".assets-site-header__nav");
  if (!header || !nav) return;

  header.classList.toggle("assets-site-header--menu-open", open);
  nav.classList.toggle("assets-site-nav--open", open);
  document.body.classList.toggle("assets-site-nav--open", open);
}

export default function HeaderMenuController() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const toggle = target.closest(
        ".assets-site-header__menu-toggle, .assets-site-header__menu-close, [data-menu-toggle]"
      );
      if (toggle) {
        event.preventDefault();
        const isOpen = document.body.classList.contains("assets-site-nav--open");
        toggleMobileNav(!isOpen);
        return;
      }

      const link = target.closest(".assets-site-header__nav a");
      if (link && window.matchMedia("(max-width: 767px)").matches) {
        toggleMobileNav(false);
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
