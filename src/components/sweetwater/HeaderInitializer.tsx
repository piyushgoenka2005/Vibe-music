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

function loadHeaderScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector("script[data-sweetwater-header]")) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://assets.sweetwater.com/dist/templates/header.js";
    script.async = true;
    script.dataset.sweetwaterHeader = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("header.js failed to load"));
    document.body.appendChild(script);
  });
}

export default function HeaderInitializer() {
  useEffect(() => {
    applyDesktopNavClass();

    loadHeaderScript()
      .then(() => applyDesktopNavClass())
      .catch(() => {});

    const onResize = () => applyDesktopNavClass();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
