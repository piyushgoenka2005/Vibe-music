"use client";

import { useEffect } from "react";
import { LOGO_PATH } from "@/lib/mediaAssets";
import { loadReferenceHeaderScript } from "@/lib/loadReferenceHeader";

function applyLogo() {
  document
    .querySelectorAll<HTMLImageElement>(
      ".assets-site-header__menu-logo, .assets-site-header__menu-logo-wrap img"
    )
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
    let headerScriptReady = false;

    const run = async () => {
      applyDesktopNavClass();

      if (!headerScriptReady && document.getElementById("assets-header")) {
        try {
          await loadReferenceHeaderScript();
          headerScriptReady = true;
        } catch {
          // Reference script unavailable — inline CSS parity still applies.
        }
      }

      applyLogo();
      window.dispatchEvent(new CustomEvent("vibe:header-ready"));
    };

    const timeoutId = window.setTimeout(() => {
      void run();
    }, 0);

    const observer = new MutationObserver(() => {
      void run();
    });

    const headerHost = document.querySelector('[data-vibe-section="header"]');
    if (headerHost) {
      observer.observe(headerHost, { childList: true, subtree: true });
    } else {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    const onResize = () => applyDesktopNavClass();
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
