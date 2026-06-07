"use client";

import { useEffect } from "react";
import { LOGO_PATH } from "@/lib/mediaAssets";

function applyLogo() {
  const logoNodes = document.querySelectorAll<HTMLImageElement>(
    ".assets-site-header__menu-logo"
  );
  logoNodes.forEach((img) => {
    img.src = LOGO_PATH;
    img.alt = "Vibe Music";
  });

  document
    .querySelectorAll<HTMLImageElement>(".assets-site-header__menu-logo-wrap img")
    .forEach((img) => {
      img.src = LOGO_PATH;
      img.alt = "Vibe Music";
    });
}

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
    const timeoutId = window.setTimeout(() => {
      applyLogo();
      applyDesktopNavClass();
    }, 0);
    const onResize = () => applyDesktopNavClass();
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
