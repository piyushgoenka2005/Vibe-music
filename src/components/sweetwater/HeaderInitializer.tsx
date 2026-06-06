"use client";

import { useEffect } from "react";

function applyDesktopNavClass() {
  const header = document.getElementById("assets-header");
  const nav = document.querySelector(".assets-site-header__nav");
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;

  if (isDesktop) {
    header?.classList.add("assets-site-nav--desktop");
    nav?.classList.add("assets-site-nav--desktop");
    document.body.classList.add("assets-site-nav--desktop");
  } else {
    header?.classList.remove("assets-site-nav--desktop");
    nav?.classList.remove("assets-site-nav--desktop");
    document.body.classList.remove("assets-site-nav--desktop");
  }
}

export default function HeaderInitializer() {
  useEffect(() => {
    applyDesktopNavClass();
    const onResize = () => applyDesktopNavClass();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return null;
}
