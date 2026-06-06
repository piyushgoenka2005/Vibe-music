"use client";

import { useEffect } from "react";
import { BRAND } from "@/lib/brand";
import { useAuthStore } from "@/store/authStore";

const SECTION_SELECTOR =
  '[data-sweetwater-section="header"], [data-sweetwater-section="main"], [data-sweetwater-section="footer"]';

const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Sweetwater®/g, `${BRAND.name}®`],
  [/Sweetwater Card/g, BRAND.cardName],
  [/Sweetwater Sales Engineer/g, `${BRAND.name} ${BRAND.supportRole}`],
  [/Sales Engineer/g, BRAND.supportRole],
  [/Sweetwater Support/g, `${BRAND.name} Support`],
  [/Sweetwater's/g, `${BRAND.name}'s`],
  [/Sweetwater/g, BRAND.name],
  [/sweetwater/g, "vibemusic"],
  [/\(800\) 222-4700/g, BRAND.phoneDisplay],
  [/\(800\) 222-4701/g, BRAND.phoneDisplay],
  [/#NewGearDay/gi, "#VibeMusicGear"],
  [/New Gear Day/gi, "VibeMusic Gear"],
  [/this\.cartQty/g, ""],
  [/Your Cart ID is \.{3,}/g, ""],
  [/Cart ID: \.{3,}/g, ""],
  [/>Headline</g, ">Featured Deal<"],
];

function replaceInText(value: string): string {
  let next = value;
  for (const [pattern, replacement] of TEXT_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  return next;
}

function patchElement(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    for (const attr of ["alt", "aria-label", "title", "placeholder"] as const) {
      const value = el.getAttribute(attr);
      if (!value || !/sweetwater|800.?222.?4700|sales engineer/i.test(value)) continue;
      const next = replaceInText(value);
      if (next !== value) {
        el.setAttribute(attr, next);
      }
    }
  });

  root.querySelectorAll<HTMLAnchorElement>("a[href^='tel:']").forEach((link) => {
    const nextHref = `tel:${BRAND.phone}`;
    if (link.getAttribute("href") !== nextHref) {
      link.setAttribute("href", nextHref);
    }
  });

  root
    .querySelectorAll<HTMLImageElement>(
      '.assets-site-header__menu-logo-wrap img, img[src*="sweetwater-logo"]'
    )
    .forEach((img) => {
      if (img.dataset.vibeLogo === "true") return;
      img.src = BRAND.logoPath;
      img.alt = `${BRAND.name}®`;
      img.dataset.vibeLogo = "true";
    });

  root.querySelectorAll<HTMLElement>(".personalization-widgets__greeting").forEach((el) => {
    if (el.dataset.vibeGreeting === "true") return;

    const user = useAuthStore.getState().user;
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    const nextText = isAuthenticated && user?.name
      ? `Welcome back, ${user.name.split(" ")[0]}!`
      : el.textContent?.includes("Welcome back")
        ? `Welcome to ${BRAND.name}!`
        : null;

    if (nextText && el.textContent !== nextText) {
      el.textContent = nextText;
    }
    el.dataset.vibeGreeting = "true";
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    const value = node.textContent ?? "";
    if (/sweetwater|800.?222.?4700|this\.cartQty|Headline|\.\.\.\.\./i.test(value)) {
      textNodes.push(node as Text);
    }
    node = walker.nextNode();
  }
  textNodes.forEach((textNode) => {
    const current = textNode.textContent ?? "";
    const next = replaceInText(current);
    if (next !== current) {
      textNode.textContent = next;
    }
  });
}

export default function BrandPatcher() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    let patching = false;
    let scheduled = false;

    function patchAll() {
      if (patching || scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        if (patching) return;
        patching = true;
        try {
          document.querySelectorAll(SECTION_SELECTOR).forEach((section) => {
            patchElement(section);
          });
        } finally {
          patching = false;
        }
      });
    }

    patchAll();

    const observer = new MutationObserver(patchAll);
    document.querySelectorAll(SECTION_SELECTOR).forEach((section) => {
      observer.observe(section, { childList: true, subtree: true });
    });

    return () => observer.disconnect();
  }, [user?.name, isAuthenticated]);

  return null;
}
